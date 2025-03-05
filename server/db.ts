import { MongoClient } from 'mongodb';



const client = new MongoClient("mongodb+srv://0xfliz:vNbGThX2iqMCpeUV@p2p.n9fyj.mongodb.net/");
const db = client.db('p2p_marketplace');

export { db, client };