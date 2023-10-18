const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];


function verifIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;
  const customer = customers.find(customer => customer.cpf === cpf);
  if (!customer) {
    return response.status(400).json({ error: "Customer not found" })
  }
  request.customer = customer;
  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation === "credit") {
      return acc + operation.amount;
    } else {
      return acc + operation.amount;
    }
  }, 0);
  return balance;
}

app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const customersAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customersAlreadyExists) {
    return response.status(400).json({ error: "Costomer already exists!" })
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  })

  return response.status(201).send();
});


app.get("/statement", verifIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  return response.json(customer.statement);

});

app.post("/deposit", verifIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body

  const { customer } = request;

  const statewmentOperations = {
    description,
    amount,
    created_at: new Date(),
    type: "credit"
  }

  customer.statement.push(statewmentOperations);
  response.status(201).send();
});

app.post("/withdraw", verifIfExistsAccountCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);
  if (balance < amount) {
    return response.status(400).json({ error: "infuficient funds!" })
  }

  const statewmentOperations = {
    amount,
    created_at: new Date(),
    type: "debit"
  }

  customer.statement.push(statewmentOperations);

  return response.status(201).send();

})

app.get("/statement/date", verifIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  return response.json(statement);

});

app.put("/account", verifIfExistsAccountCPF, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(201).send();
});

app.get("/account", verifIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer);
});

app.delete("/account", verifIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);
  return response.status(200).json(customers)
});

app.get("/balance", verifIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  const balance = getBalance(customer.statement);

  response.json(balance);
})

app.listen(3333);