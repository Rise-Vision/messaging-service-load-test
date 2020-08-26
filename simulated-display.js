const Primus = require("primus");
const crypto = require("crypto");

const {
  MS_ENDPOINT: msEndpoint = ""
} = process.env;

const Socket = Primus.createSocket({
  transformer: "websockets",
  pathname: '/messaging/primus'
});

function generateDisplayId() {
  return new Promise(res=>{
    crypto.randomBytes(6, (err, buf) => {
      if (err) return Promise.reject(err);

      res(buf.toString("hex").toUpperCase());
    });
  });
};

module.exports = {
  instantiateDisplay() {
    return generateDisplayId()
    .then(displayId=>{
      const machineId = Math.random();

      const connection = new Socket(`${msEndpoint}?displayId=${displayId}&machineId=${machineId}`, {
        reconnect: {
          max: 1800000,
          min: 5000,
          retries: 8
        },
        manual: true
      });

      connection.on("open", ()=>{
        console.log(`messaging service connected ${displayId}`);
        connection.write({
          topic: "WATCHLIST-COMPARE",
          lastChanged: Date.now()
        });
      });

      connection.on("close", ()=>{
        console.log(`messaging service connection closed ${displayId}`);
      });

      connection.on("end", ()=>{
        console.log(`messaging service disconnected ${disconnected}`);
      });

      connection.on("data", (data)=>{
        console.log(`data recieved ${displayId}`);
        console.log(data);
      });

      connection.on("error", (error)=>{
        console.log(`messaging error ${displayId}`);
        console.error(error);
      });

      return {
        displayId,
        connect() {connection.open();}
      };
    });
  }
};

