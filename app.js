// requerimos mongoose
const mongoose = require('mongoose');

// conectamos con la base de datos de mongo, que si no la tenemos creada, la creará vacía automáticamente
mongoose.connect('mongodb://localhost:27017/demo', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Conectado a MongoDB...'))
    .catch(err => console.log('No se puedo conectar con MongoDB...', err));

// creamos un esquema, esta es la estructura de datos que queremos que tenga cada documento de nuestra colección
// tiene mucha similitud con los modelos de TypeScript
const cursoSchema = new mongoose.Schema({
    nombre: String,
    autor: String,
    etiquetas: [String],
    fecha: {
        type: Date,
        default: Date.now
    },
    publicado: Boolean
});

// creamos el modelo, que utilizará el esquema anterior
const Curso = mongoose.model('Curso', cursoSchema);

/* 
    OJO!! en estos ejemplos utilizamos el modelo "Curso" en el mismo documento que las funciones que lo van a llamar, pero 
    sería mas correcto y mas limpio crear un archivo aparte con todos los modelos y requerirlos en el archivo donde vayas a 
    utilizarlo.

    Es decir, todo lo anterior a este párrafo iría en documento aparte, por lo general dentro de la carpeta de nuestro 
    proyecto: "src/models/Curso.js" --> por convención los modelos deben ir en mayúsculas para distinguirlos
*/



async function crearCurso() {
    // cada vez que utilicemos Curso, estaremos instanciando al esquema a través del modelo Curso
    const curso1 = new Curso({
        nombre: 'Angular para principiantes',
        autor: 'Rubén',
        etiquetas: ['Desarrollo web', 'Front end'],
        publicado: true
    });
    /*
        con el método save se guarda el curso, como este guardado va a requerir de un tiempo en el que
        tiene que conectar con la DB, debemos indicarle al método "save" que espere a la respuesta devuelta por la misma. 
        Para ello utilizamos await. Sabemos que para que un await funcione, debemos meterlo dentro de una función asíncrona.
    */
    const resultado = await curso1.save();
    console.log(resultado);
}
// crearCurso();



async function listarCursos() {
    // listamos todo el contenido de la colección Curso
    const cursos = await Curso
        // .find(); // todos los documentos de la colección
        // .find({ autor: 'José' }); // buscamos todos los documentos cuyo autor sea José
        .find({ publicado: true }) // todos los documentos cuyo campo publicado sea true
        .limit(5) // limitamos la búsqueda a 5 documentos
        // .sort({ autor: 1 }) // ordenamiento ascendente por el campo autor
        .sort({ autor: -1 }) // ordenamiento descendente por el campo autor
        .select({ nombre: 1, etiquetas: 1 }) // indicamos con 1 que solo queremos seleccionar el nombre y las etiquetas
        // .select({ nombre: 0, etiquetas: 0 }) // indicamos con 0 que NO queremos seleccionar el nombre y las etiquetas
    console.log(cursos);
}
// listarCursos();



// OPERADORES DE COMPARACIÓN
async function listarCursos2() {
    /*
        eq (equal, igual)
        ne (not equal, no igual)
        gt (greater than, mayor que)
        gte (greater than or equal to, mayor o igual que)
        lt (less than, menor que)
        lte (less than or equal to, menor o igual que)
        in (algo incluido dentro de otra cosa)
        nin (not in)
    */
    const cursos = await Curso
        // .find({ precio: 10 }) // buscamos un curso que cueste 10
        .find({ precio: { $gte: 10, $lte: 30 } }) // buscamos los cursos que cuesten entre 10 y 30, mayor o igual que 10, menor o igual que 30
        .find({ precio: { $in: [10, 15, 25] } }) // buscamos cursos cuyo rango de precios esté incluido en nuestro array, 10, 15 y 25 (también funciona con texto, es decir, arrays de tipo string)
    console.log(cursos);
}
// listarCursos2();



// OPERADORES LÓGICOS
async function listarCursos3() {
    // or
    // and
    const cursos = await Curso
        .find({ precio: 10 }) // buscamos un curso que cueste 10
        .or([{ autor: 'José' }, { publicado: true }]) // nos devolverá el resultado siempre que autor sea José "O" publicado sea true
        .and([{ autor: 'José' }, { publicado: false }]) // nos devolverá el resultado siempre que autor sea José "Y" publicado sea false
    console.log(cursos);
}
// listarCursos3();



// EXPRESIONES REGULARES
async function listarCursos4() {
    /*  
        para utilizar expresiones regulares utilizaremos las dos barras inclinadas //
        dentro de ellas ^ para indicar el comienzo de la expresión regular o $ para
        indicar el fin de la expresión regular, ejem. /^$/ y entre una y otra la expresión,
        empieza por al --> /^al/
        acaba por al --> /al$/
    */
    const cursos = await Curso
        // .find({ autor: /^Jo/ }) // empieza por la palabra "Jo"
        // .find({ autor: /^jo/ }) // empieza por la palabra "jo" OJO!!! que es case sensitive, distingue entre mayúsculas y minúsculas
        // .find({ autor: /sé$/ }) // termina por la palabra "sé"
        // .find({ autor: /se$/ }) // termina por la palabra "se" OJO!!! que también es sensible a los caracteres especiales
        .find({ autor: /.*é.*/ }) // cuando un campo tiene un contenido específico, va a buscar todos los autores con "é" en su nombre
    console.log(cursos);
}
// listarCursos4();



// PAGINACIÓN EN CONSULTAS
async function listarCursos5() {
    /*  
        Estos valores suelen venir como parámetros a nuestra api rest
        por ejemplo --> http://localhost:3000/api/cursos?numeroPagina=2&tamanoPagina=10
        a través de query, según el ejemplo anterior
        Esto lo recogeríamos de la siguente forma:
        const numeroPagina = req.query.numeroPagina;
        const tamanoPagina = req.query.tamanoPagina;
    */
    const numeroPagina = 2;
    const tamanoPagina = 1;

    // con skip() y limit() vamos a indicarle que nos muestre la página 2 (puede que la búsqueda tenga cientos de páginas)
    // y que el límite de documentos que nos va a mostrar por cada página sea 1
    const cursos = await Curso
        .find({ publicado: true }) // que me muestre todos los documentos publicados
        .skip((numeroPagina - 1) * tamanoPagina) // le estamos indicando que nos muestre la página 2 concretamente
        .limit(tamanoPagina) // y le estamos limitando a 10 resultados
    console.log(cursos);
}
// listarCursos5();



// ACTUALIZACIÓN DE DOCUMENTOS (1)
async function actualizarCurso(id) {
    // 1. BUSCAMOS el curso que queremos modificar y lo guardamos en una variable

    // al igual que cuando guardamos un documento, el método findById() tarda un tiempo en devolver el resultado de la 
    // interacción con la DB, es decir, es una promesa, así que debemos indicarle a JS que debe esperar con await
    const curso = await Curso.findById(id);

    // ahora vamos a chequear que el curso exista, ya que puede ser que nos pasen un id erróneo
    if (!curso) {
        console.log('El curso no existe');
        return;
    }

    // 2. MODIFICAMOS el contenido del curso que hemnos encontrado

    // para alterar el documento tenemos dos formas
    //  - alterando directamente las propiedades del documento
    curso.publicado = false;
    curso.autor = 'José Pato';

    //  - o utilizando el método set y modificando el objeto
    // curso.set({
    //     publicado: false,
    //     autor: 'José Pato'
    // })

    // 3. GUARDAMOS en la DB el resultado de la modificación utilizando el método save()
    const resultado = await curso.save();

    console.log(resultado);
}
// actualizarCurso('60ed53d2ca604c1e64cc0613');



// ACTUALIZACIÓN DE DOCUMENTOS (2), UTILIZANDO OPERADORES DE ACTUALIZACIÓN
async function actualizarCurso2(id) {
    // buscamos, modificamos y guardamos utilizando un único método.

    // UPDATE se encuentra deprecated, así que utilizaremos lo que nos recomienda la documentación, 
    // en este caso UPDATEONE ó UPDATEMANY si queremos modificar mas de un documento

    // updateOne() necesita por un lado recibir el ID { _id: id } 
    // y por otro lado un objeto con los valores que quieres modificar $set: { xxxx: xxxx }
    const resultado = await Curso.updateOne({ _id: id }, {
        $set: {
            autor: 'José Pato Rodríguez',
            publicado: true
        }
    });
    console.log(resultado);
}
// actualizarCurso2('60ed53d2ca604c1e64cc0613');



// ACTUALIZACIÓN DE DOCUMENTOS (3)
async function actualizarCurso3(id) {
    // buscamos, modificamos y guardamos utilizando un único método.

    /*
        la diferencia entre updateOne / updateMany y findByAndUpdate, es que de esta última forma resulta algo mas sencillo, 
        ya que no hay que pasarle un objeto con el campo _id: y el id, sino que directamente recibe el id y nos devuelve 
        como resultado el objeto ANTES de ser modificado. 
        
        En el método anterior nos devolvía una confirmación de la opreación pero no los campos modificados
    */
    const resultado = await Curso.findByIdAndUpdate(id, {
        $set: {
            autor: 'Don José',
            publicado: false
        }
    });
    console.log(resultado);
}
// actualizarCurso3('60ed53d2ca604c1e64cc0613');



// ACTUALIZACIÓN DE DOCUMENTOS (4), continuación del anterior
async function actualizarCurso4(id) {
    const resultado = await Curso.findByIdAndUpdate(id, {
        $set: {
            autor: 'Don José',
            publicado: true
        }
    }, { new: true }); // si queremos que como resultado nos devuelva el documento actualizado y no el anterior, le tenemos que pasar 
    // el objeto como otro parámetro mas a la consulta, y este objeto debe tener el campo new a true.
    console.log(resultado);
}
// actualizarCurso4('60ed53d2ca604c1e64cc0613');



// ELIMINACIÓN DE DOCUMENTOS
async function eliminarCurso(id) {
    // buscamos y eliminamos

    // utilizamos DELETEONE para eliminar un solo documento ó DELETEMANY para eliminar varios a la vez
    // deleteOne necesita de un id para saber qué documento eliminar

    // const resultado = await Curso.deleteOne({ _id: id }); // nos devuelve una confirmación del borrado del documento
    const resultado = await Curso.findByIdAndDelete({ _id: id }); // nos devuelve el objeto que ha sido eliminado
    console.log(resultado);
}
// eliminarCurso('60ed547fddfbb61170af20f1');