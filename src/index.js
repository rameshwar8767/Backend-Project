//require ('dotenv').config({path : './env'})

import dotenv from "dotenv"
import {app} from './app.js'

import connectDB from "./db/index.js";
dotenv.config({
    path:'./env'
})




connectDB()
.then(()=>{
    app.on("error", ()=>{
        console.log("ERROE:", error);
        throw error
    })
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server running on port ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log("MONGODB connection failed !!!", error);
    
})





/*
import express from "express"
const app = express()

( async ()=> {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", ()=>{
            console.log("ERROE:", error);
            throw error
        })
        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on port ${process.env.PORT}`);
            
        })
    }catch(error){
        console.error("ERROR:", error);
        
    }
})()
*/