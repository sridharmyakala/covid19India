const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndSerer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndSerer();

// convert snacase to camalcase

const convertToStatesTableIntoResponseObj = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

const convertTDistrictIntoResponseObj = (obj) => {
  return {
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
};

// Returns a list of all states in the state table

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state;
    `;
  const dbResponse = await db.all(getStatesQuery);
  response.send(
    dbResponse.map((each) => convertToStatesTableIntoResponseObj(each))
  );
});

// Returns a state based on the state ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateBasedOnStateIdQuery = `
    SELECT * FROM state WHERE state_id = ${stateId};
    `;
  const dbResponse = await db.get(getStateBasedOnStateIdQuery);
  response.send(convertToStatesTableIntoResponseObj(dbResponse));
});

// Create a district in the district table, district_id is auto-incremented

app.post("/districts/", async (request, response) => {
  const requestBody = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = requestBody;
  const createDistrictQuery = `
    INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
    VALUES('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});
    `;
  await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

// Returns a district based on the district ID

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictBasedOnDistrictIdQuery = `
    SELECT * FROM district WHERE district_id = ${districtId};
    `;
  const dbResponse = await db.get(getDistrictBasedOnDistrictIdQuery);
  response.send(convertTDistrictIntoResponseObj(dbResponse));
});

// Deletes a district from the district table based on the district ID

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district WHERE district_id = ${districtId};
    `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// Updates the details of a specific district based on the district ID

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const requestBody = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = requestBody;
  const updateDistrictQuery = `
    UPDATE district SET district_name = '${districtName}', state_id = ${stateId}, cases = ${cases}, cured = ${cured}, active = ${active}, deaths = ${deaths} WHERE district_id = ${districtId};
    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// convert snacase to camalcase
const convertSnacaseToCamalcase = (obj) => {
  return {
    totalCases: obj.total_cases,
    totalCured: obj.total_cured,
    totalActive: obj.total_active,
    totalDeaths: obj.total_deaths,
  };
};

// Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getTotalDataQuery = `
    SELECT 
    SUM(cases) as total_cases,
    SUM(cured) as total_cured,
    SUM(active) as total_active,
    SUM(deaths) as total_deaths
    FROM district
    WHERE state_id = ${stateId};
    `;
  const dbResponse = await db.get(getTotalDataQuery);
  response.send(convertSnacaseToCamalcase(dbResponse));
});

//Returns an object containing the state name of a district based on the district ID

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
    SELECT state_id FROM district WHERE district_id = ${districtId};
    `;
  const stateId = await db.get(getDistrictIdQuery);
  const getStateNameQuery = `
    SELECT state_name FROM state WHERE state_id = ${stateId.state_id};
    `;
  const stateName = await db.get(getStateNameQuery);
  response.send(convertToStatesTableIntoResponseObj(stateName));
});

module.exports = app;
