const express = require('express')
const { Router } = express

const ContenedorArchivo = require('./contenedores/ContenedorArchivo.js')

//--------------------------------------------
// instancio servidor y persistencia

const app = express()

const productosApi = new ContenedorArchivo('dbProductos.json')
const carritosApi = new ContenedorArchivo('dbCarritos.json')

//--------------------------------------------
// permisos de administrador

const esAdmin = true

function crearErrorNoEsAdmin(ruta, metodo) {
    const error = {
        error: -1,
    }
    if (ruta && metodo) {
        error.descripcion = `ruta '${ruta}' metodo '${metodo}' no autorizado`
    } else {
        error.descripcion = 'no autorizado'
    }
    return error
}

function soloAdmins(req, res, next) {
    if (!esAdmin) {
        res.json(crearErrorNoEsAdmin())
    } else {
        next()
    }
}

//--------------------------------------------
// configuro router de productos


//funciones productos 

const getProducts = async (req, res) => {
    const productos = await productosApi.listarAll()
    res.json(productos)
}


const getProductById = async (req, res) => {
    res.json(await productosApi.listar(req.params.id))
}


const addProduct = async (req, res) => {
    res.json({ id: await productosApi.guardar(req.body) })
}


const updateProducts = async (req, res) => {
    res.json(await productosApi.actualizar(req.body, req.params.id))
}


const deleteProduct = async (req, res) => {
    res.json(await productosApi.borrar(req.params.id))
}


//RUTAS PRODUCTOS
const productosRouter = new Router()
productosRouter.get('/', getProducts)
productosRouter.get('/:id', getProductById)
productosRouter.post('/', soloAdmins, addProduct)
productosRouter.put('/:id', soloAdmins, updateProducts)
productosRouter.delete('/:id', soloAdmins, deleteProduct)

//--------------------------------------------
// configuro router de carritos


//funciones carrito


const getCart = async (req, res) => {
    res.json((await carritosApi.listarAll()).map(c => c.id))
}

const newProduct = async (req, res) => {
    res.json({ id: await carritosApi.guardar({ productos: [] }) })
}

const deleteCart = async (req, res) => {
    res.json(await carritosApi.borrar(req.params.id))
}


const getProductFromCart = async (req, res) => {
    const carrito = await carritosApi.listar(req.params.id)
    res.json(carrito.productos)
}


const addProductToCart = async (req, res) => {
    const carrito = await carritosApi.listar(req.params.id)
    const producto = await productosApi.listar(req.body.id)
    carrito.productos.push(producto)
    await carritosApi.actualizar(carrito, req.params.id)
    res.end()
}


const deteleProductFromCart = async (req, res) => {
    const carrito = await carritosApi.listar(req.params.id)
    const index = carrito.productos.findIndex(p => p.id == req.params.idProd)
    if (index != -1) {
        carrito.productos.splice(index, 1)
        await carritosApi.actualizar(carrito, req.params.id)
    }
    res.end()
}


//RUTAS CARRITOS
const carritosRouter = new Router()
carritosRouter.get('/', getCart)
carritosRouter.post('/', newProduct)
carritosRouter.delete('/:id', deleteCart)
carritosRouter.get('/:id/productos', getProductFromCart)
carritosRouter.post('/:id/productos', addProductToCart)
carritosRouter.delete('/:id/productos/:idProd', deteleProductFromCart)



//--------------------------------------------
// configuro el servidor

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

app.use('/api/productos', productosRouter)
app.use('/api/carritos', carritosRouter)

module.exports = app