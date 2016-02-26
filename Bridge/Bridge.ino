#include <Wire.h>
#include <Mesh.h>
#include <AquilaProtocol.h>
#include "SlipLocal.h"
#include "CRCLocal.h"

/*
  Bridge
  Puente que permite al servidor comunicarse con los sensores en la red Aquila
  Utilizaremos el protocolo SLIP mas un CRC para la comunicación entre el servidor
  y el Puente.

  Los mensajes tendrán el siguiente formato (protocolo):
  [comando][parámetro]
  [último byte de la dirección corta][primer byte de la dirección]
  [byte 8 de la dirección larga]...[byte 1 de la dirección larga]
  [primeros 8 bits del CRC][últimos 8 bits del CRC]

  Nota: cada valor en "[]" representa un byte.

  Comandos:
  Del Puente a la PC:
  0: lleva como parámetro la temperatura, lo manda el Puente hacia la PC cuando recibe un dato.
  7: Respuesta de Ping
  
  De la PC al puente:
  0: Ping, para saber si el puente está funcionando correctamente, tenemos que responder

 */

// Dirección que le vamos a fijar al puente
// HUB es una dirección predefinida correspondiente a 0x00FF
#define ADDRESS HUB
// Velocidad de la comunicación serial
#define BAUDRATE 57600
// Instanciamos el objeto que se encargará de la comunicación serial con protocolo SLIP
Slip slip;

// Recibe la lectura de temperatura de cualquier sensor y envíala al servidor
bool onTempMeasured(uint8_t param, bool hasParam, uint16_t shortAddr, uint8_t *longAddr)
{
  char data[14];
  data[0] = 0;
  data[1] = param;
  data[2] = shortAddr & 0xFF;
  data[3] = (shortAddr>>8) & 0xFF;
  memcpy(&data[4], longAddr, 8);
  uint8_t size = appendCrc(data, 12);
  slip.send(data, size);
  return true;
}

// Responde un Ping de la PC
void sendSlipPing()
{
  char data[14];
  data[0] = 7;
  uint8_t size = appendCrc(data, 12);
  slip.send(data, size);
}

void parseCommand(char *data, uint8_t size)
{
  if(size < 4) return;// Expected size

  uint8_t command = data[0];
  uint8_t param = data[1];
  // IMPORTANT making & with 0x00FF and 0xFF00
  uint16_t destAddr = (data[2] & 0x00FF) | (((uint16_t)data[3] << 8) & 0xFF00);

  // Ahora sólo tenemos definido el comando 0 para slip ping
  switch (command)
  {
    case 0: // ping
      sendSlipPing();
    break;
  }

}

static void onData(char *data, uint8_t size)
{
  // Cuando recibimos un dato por Slip, checamos su CRC y 
  // parseamos para realizar la acción que corresponda
  if(checkCrc(data, size))
  {
      size -= 2;
      parseCommand(data, size);
  }
  else
  {
      //"CRC error"
  }
}

void setup()
{
  Mesh.begin(ADDRESS);
  Aquila.begin();
  Aquila.setClass("mx.makerlab.bridge");
  Aquila.setName("Bridge");
  // Cada que se emita un evento "tempMeasured" en la red, 
  // llamar a la función onTempMeasured
  Aquila.on("tempMeasured", onTempMeasured);

  // Inicializa la comunicación serial con SLIP con la PC.
  // La función onData será llamada cuando la PC envía algún dato al Puente
  slip.begin(BAUDRATE, onData);
}

void loop()
{
  slip.loop();
  Mesh.loop();
  Aquila.loop();
}