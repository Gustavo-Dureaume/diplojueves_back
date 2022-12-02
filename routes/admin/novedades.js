var express = require('express');
const pool = require('../../models/bd');
// const { post } = require('..');
var router = express.Router();
var novedadesModel = require('../../models/novedadesModel');
var util = require('util');
var cloudinary = require('cloudinary').v2;
const uploader = util.promisify(cloudinary.uploader.upload);
const destroy = util.promisify(cloudinary.uploader.destroy);

/* para listar las novedades */
router.get('/', async  function(req, res, next) {
    var novedades = await novedadesModel.getNovedades();

    novedades = novedades.map(novedad => {
      if(novedad.img_id){
        const imagen = cloudinary.image(novedad.img_id, {
          width:100,
          height:100,
          crop: 'fill'  //o pad 
        });
        return{
          ...novedad,
          imagen
        }
      }else{
        return{
          ...novedad,
          imagen:''
        }
      }
    }); 

  res.render('admin/novedades', { //es login.hbs
    layout:'admin/layout', // es layout.hbs
    persona: req.session.nombre, novedades
  });
}); // cierra inicial


// diseño de agregar
router.get('/agregar', (req, res, next)=>{
    res.render('admin/agregar', {
        layout: 'admin/layout'
    }) //cierra rener
}); //cierra get

// insertar la novedad

router.post('/agregar', async(req, res, next)=>{
  try{

    var img_id = '';
      if(req.files && Object.keys(req.files).length > 0){
        imagen = req.files.imagen;
        img_id = (await uploader(imagen.tempFilePath)).public_id;
      }


    if (req.body.titulo != "" && req.body.subtitulo != "" && req.body.cuerpo != ""){
      await novedadesModel.insertNovedad({
        ...req.body, //tit, subt y cuerpo
        img_id,
        
      });
       res.redirect('/admin/novedades')
      }else{
        res.render('admin/agregar', {
          layout: 'admin/layout', 
          error: true, 
          message: 'Todos los campos son requeridos'
        })
      }
}catch (error) {
  console.log(error)
  res.render('admin/agregar',{
    layout: 'admin/layout',
    error:true, 
    message: 'No se cargo la novedad'
  })
}
})

// eliminar novedad

router.get('/eliminar/:id', async (req, res, next)=>{
  var id = req.params.id;

  let novedad = await novedadesModel.getNovedadesById(id);
  if (novedad.img_id){
    await (destroy(novedad.img_id));

  }
  await novedadesModel.deleteNovedadesById(id);
   res.redirect('/admin/novedades');
 
}); //cierra get

// modificar la vista traer formulario y los datos cargados
router.get('/modificar/:id', async (req, res, next)=>{
  var id = req.params.id;
  // console.log(req.params.id);
  var novedad = await novedadesModel.getNovedadesById(id);
   
  // console.log(req.params.id);
  res.render('admin/modificar', {
    layout: 'admin/layout',
    novedad
  })
  });

  // actualiza

  router.post('/modificar', async(req, res, next)=>{
    try{

      let img_id = req.body.img_original;
      let borrar_img_vieja = false;
      if(req.body.img_delete === "1"){
        img_id = null;
        borrar_img_vieja = true;
      }else{
        if(req.files && Object.keys(req.files).length > 0){
          imagen = req.files.imagen;
          img_id = (await uploader(imagen.tempFilePath)).public_id;
          borrar_img_vieja = true;
        }
      }
      if(borrar_img_vieja && req.body.img_original){
        await(destroy(req.body.img_original));
      }

      var obj= {
        titulo: req.body.titulo,
        subtitulo: req.body.subtitulo,
        cuerpo: req.body.cuerpo, img_id
      }
      console.log(obj)

      await novedadesModel.modificarNovedadById(obj, req.body.id);
      res.redirect('/admin/novedades');
    }catch (error){
      console.log(error)
      res.render('admin/modificar', {
        layout: 'admin/layout',
        error: true,
        message: 'No se modifico la novedad'
      })
    }
  })

module.exports = router;