const { Worker } = require("bullmq");

const connection =
require("../queues/connection");

const { exec } =
require("child_process");


const worker =
new Worker(

"ingestion-jobs",

async(job)=>{


console.log(
"Running NewsLens AI pipeline"
);



return new Promise(
(resolve,reject)=>{


exec(
"python3 ../ingestion/run_pipeline.py",

(error,stdout,stderr)=>{


if(error){

reject(error);

return;

}


console.log(stdout);


resolve({
success:true
});


});


});


},


{
connection,
concurrency:1
}


);



worker.on(
"completed",
(job)=>{

console.log(
"AI job completed",
job.id
);

});


worker.on(
"failed",
(job,error)=>{

console.error(
"AI job failed",
error.message
);

});