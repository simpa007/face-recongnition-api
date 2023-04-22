const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const knex = require("knex");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const db = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    port: 5432,
    user: "postgres",
    password: "postgres",
    database: "facerecongnitionDB",
  },
});

// db.select("*")
//   .from("users")
//   .then((data) => {
//     console.log(data);
//   });

const app = express();
app.use(cors());
app.use(express.json());
const database = {
  users: [
    {
      id: 1,
      name: "Sally",
      email: "sall@gmail.com",
      password: "azxy123",
      entries: 0,
      join: new Date(),
    },
    {
      id: 2,
      name: "John",
      email: "johndoe@gmail.com",
      password: "ddge234",
      entries: 0,
      join: new Date(),
    },
  ],
};

app.get("/", (req, res) => {
  res.json(database.users);
});

app.post("/signin", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json("incorrect form submission");
  }
  db.select("email", "hash")
    .from("login")
    .where("email", "=", email)
    .then((data) => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return db
          .select("*")
          .from("users")
          .where("email", "=", email)
          .then((user) => {
            res.json(user[0]);
          })
          .catch((err) => res.status(400).json("unable to get user"));
      } else {
        res.status(400).json("wrong credentials");
      }
    })
    .catch((err) => res.status(400).json("wrong credentials"));
  // if (
  //   req.body.password === database.users[0].password &&
  //   req.body.email === database.users[0].email
  // ) {
  //   res.json(database.users[0]);
  // } else {
  //   res.status(400).json("wrong email and password");
  // }
});
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json("incorrect form submission");
  }
  const hash = bcrypt.hashSync(password, saltRounds);
  db.transaction((trx) => {
    trx
      .insert({
        hash: hash,
        email: email,
      })
      .into("login")
      .returning("email")
      .then((loginEmail) => {
        return trx("users")
          .returning("*")
          .insert({
            name: name,
            email: loginEmail[0],
            joined: new Date(),
          })
          .then((user) => {
            res.json(user[0]);
          })
          .catch((err) => {
            res.json(err);
          });
      })
      .then(trx.commit)
      .catch(trx.rollback);
  }).catch((err) => {
    res.status(404).json(err, "something went wrong");
  });
  // if (
  //   req.body.password === database.users[0].password ||
  //   req.body.email === database.users[0].email
  // ) {
  //   res.json("email and password already in use");
  // } else {
  //   const newData = {
  //     id: database.users.length + 1,
  //     name: req.body.name,
  //     email: req.body.email,
  //     entries: 0,
  //     join: new Date(),
  //   };

  //   database.users.push(newData);
  //   res.json(database.users[database.users.length - 1]);
  // }
});
app.get("/profile/:id", (req, res) => {
  const paramsId = Number(req.params.id);
  db.select("*")
    .from("users")
    .where({ id: paramsId })
    .then((user) => {
      if (user.length) {
        res.json(user[0]);
      } else {
        res.status(400).json("Not Found");
      }
    })
    .catch((err) => {
      res.status(400).json(err, "error getting user");
    });
  // let found = false;
  // database.users.forEach((user) => {
  //   if (user.id === id) {
  //     found = true;
  //     return res.json(user);
  //   }
  // });
  // if (!found) {
  //   res.status(404).json("user does not exist");
  // }
});

app.put("/image", (req, res) => {
  const id = req.body.id;
  db("users")
    .where("id", "=", id)
    .increment("entries", 1)
    .returning("entries")
    .then((entries) => {
      res.json(entries[0]);
      console.log(entries[0]);
    })
    .catch((err) => {
      res.json(400).json(err, "unable to get entries");
    });

  // let found = false;
  // database.users.forEach((user) => {
  //   if (user.id === id) {
  //     found = true;
  //     user.entries++;
  //     return res.json(user.entries);
  //   }
  // });
  // if (!found) {
  //   res.status(404).json("user does not exist");
  // }
});

const PORT = 4000 || process.env.PORT;
app.listen(PORT, () => {
  console.log(`listening @ port ${PORT}`);
});
