import { db } from "../database/database.js";
import { v4 as uuid } from "uuid";
import bcrypt from "bcrypt";
import {
  getUserByIdRepository,
  getUserByPieceUsernameRepository,
  getUserByUsernameRepository,
  followUser,
  unfollowUser,
  getUser,
  checkFollow,
} from "../repositories/userRepository.js";

export async function signUp(req, res) {
  const { email, password, username, picture_url } = req.body;
  if (!email || !password || !username || !picture_url) {
    return res.sendStatus(400);
  }

  try {
    const user = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (user.rowCount > 0) return res.status(409).send("Email already in use");

    const passwordHashed = bcrypt.hashSync(password, 10);

    const result = await db.query(
      `INSERT INTO users (email, password, username, picture_url) 
        VALUES ($1, $2, $3, $4)`,
      [email, passwordHashed, username, picture_url]
    );
    if (result.rowCount === 0) {
      return res.sendStatus(400);
    }
    return res.sendStatus(201);
  } catch (error) {
    res.status(500).send(error.message);
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  const token = uuid();

  try {
    const logged = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (logged.rowCount === 0)
      return res.status(401).send("Incorrect username or password");

    const comparePassword = bcrypt.compareSync(
      password,
      logged.rows[0].password
    );

    if (!comparePassword)
      return res.status(401).send("Incorrect username or password");

    const validToken = await db.query(
      "SELECT * FROM sessions WHERE user_id = $1",
      [logged.rows[0].id]
    );
    if (validToken.rowCount > 0) {
      await db.query("UPDATE sessions SET token = $1 WHERE user_id = $2", [
        token,
        logged.rows[0].id,
      ]);
    } else {
      await db.query("INSERT INTO sessions (user_id, token) VALUES ($1, $2)", [
        logged.rows[0].id,
        token,
      ]);
    }
    res.status(200).send({ token });
  } catch (error) {
    res.status(500).send(error.message);
  }
}

export async function logout(req, res) {
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");

  try {
    const sessionOn = await db.query(
      "SELECT * FROM sessions WHERE token = $1",
      [token]
    );
    if (!sessionOn.rows[0]) {
      return res.sendStatus(401);
    }
    await db.query("DELETE FROM sessions WHERE token = $1", [token]);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).send(error.message);
  }
}

export async function getUserById(req, res) {
  const { id } = req.params;

  try {
    const result = await getUserByIdRepository(id);

    if (result.rowCount === 0) return res.sendStatus(404);

    return res.status(200).send(result.rows[0].json_build_object);
  } catch (error) {
    return res.status(500).send(error.message);
  }
}

export async function getUserByPieceUsername(req, res) {
  const { username } = req.params;

  try {
    const result = await getUserByPieceUsernameRepository(username);

    if (result.rowCount === 0) return res.sendStatus(404);

    const users = result.rows.map((row) => row.json_build_object);

    return res.status(200).send(users);
  } catch (error) {
    return res.status(500).send(error.message);
  }
}

export async function getUserByUsername(req, res) {
    const { username } = req.params;
  
    try {
      const result = await getUserByUsernameRepository(username);
  
      if (result.rowCount === 0) return res.sendStatus(404);
    
      return res.status(200).send(result.rows[0].json_build_object);
    } catch (error) {
      return res.status(500).send(error.message);
    }
  }

  //// sprint 2
  // export async function follow(req,res) {
  //   // const { id } = req.params; //id de quem ta logado
  //   const { authorization} = req.headers;
  //   const token = authorization?.replace("Bearer ","");
  //   const followedId = req.params.id; 
    
    

  //   try{
  //     const followerId = (await getUser(token)).rows[0].user_id;
  //     await followUser(followerId, followedId)
      
  //     res.sendStatus(201);
  //   }catch(error){
     
  //     res.sendStatus(500);
  //   }
  // }

  // export async function unfollow(req,res){
  //   const { authorization} = req.headers;
  //   const token = authorization?.replace("Bearer ", "");
  //   const followedId = req.params.id
  //   try {
  //     const followerId = (await getUser(token)).rows[0].user_id;
  //     await unfollowUser(followerId, followedId)
  //     res.sendStatus(201);
  //   }catch(error){
  //     res.sendStatus(500);
  //   }
  // }

  export async function statusFollow(req,res){
    const { authorization} = req.headers;
    const token = authorization?.replace("Bearer ", "");
    
    try {
      const user_id = Number(req.params.id);
      const user_followed = (await getUser(token)).rows[0].user_id;
      
      
      const check = checkFollow(user_followed, user_id);
      if(check) {
        await unfollowUser(user_id, user_followed)
      } else {
        await followUser(user_id, user_followed)
      }
      return res.status(200).send(!check);
    }catch(error){
      return res.sendStatus(500);
    }
  }