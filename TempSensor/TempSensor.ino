#include <Wire.h>
#include <Mesh.h>
#include <AquilaProtocol.h>
#include <SimpleTimer.h>
#include <AltairTemperature.h>

/*
  TempSensor
  Nodo sensor de temperatura, obtiene la temperatura cada minuto
  y la reporta como un evento.

  Por simplicidad no utilizaremos funciones avanzadas como sleep
  o servicios (para poder enviar el punto decimal).
  Sin embargo para una implementación real si se deberían usar estas
  características.
 */

// Temporizador que se va a encargar de hacer la lectura cada cierto tiempo
SimpleTimer timer;
// Evento que se va a emitir con la temperatura
Event tempMeasured;
// Función que va a llamar el temporizador
void doMeasure()
{
  // Lee la temperatura y emite el evento, con la temperatura como parámetro
  // Nota: la temperatura se envía como entero, perdiendo el punto decimal
  // debido a que los eventos solo soportan un entero de 8 bits como parámetro
  float temp = getTempC();
  Aquila.emit(HUB, tempMeasured, temp, true);
}

void setup()
{
  // Inicialización normal de Aquila
  Mesh.begin();
  Aquila.begin();
  Aquila.setClass("mx.makerlab.thermometer");
  Aquila.setName("Thermometer");
  // Registrando el evento
  tempMeasured = Aquila.addEvent("tempMeasured");
  // Preparando el timer para que llame la función "doMeasure" cada 10000 ms
  timer.setInterval(10000, doMeasure);
  // Anunciando el dispositivo a la red, esto sólo es necesario para verlo en la interfaz de Aquila
  Mesh.announce(HUB);
}

void loop()
{
  // Atendiendo a peticiones de la red
  Mesh.loop();
  Aquila.loop();
  // Checando si debemos medir la temperatura o esperar
  timer.run();
}