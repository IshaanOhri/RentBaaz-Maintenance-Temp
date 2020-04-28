// const crypto = require('crypto-random-string');

// console.log(crypto({length : 6}));

// const jwt = require('jsonwebtoken');

// const token = jwt.sign({userID : '7b321d8308'},'press1for*88')
// console.log(token);

// let user;
// user = 'sdf';
// user = 'asd';
// console.log(user);

// const fun = () => {
//     const t = ['1', '2', '3'];
//     const exec = new Promise((resolve, reject) => {
//         t.forEach(async(p)=>{
//             await setTimeout(()=>{
//                 console.log(p);
//             },200);
//         });
//         resolve();
//     });
//     return exec;
// }

// fun().then(()=>{
//     console.log('t')
// })
// const t = ['1', '2', '3'];
// const fun = async(callback) => {
//     setTimeout(()=>{
//         t.forEach((p)=>{
//             console.log(p);
//         })
//     },500)
//     callback()
// } 
// fun(()=>{
//     console.log('t');
// })

// const fruitsToGet = ['apple', 'grape', 'pear']
// const fruitBasket = {
//     apple: 27,
//     grape: 0,
//     pear: 14
//   }

// const forLoop = async _ => {
//     console.log('Start')
  
//     for (let index = 0; index < fruitsToGet.length; index++) {
//       const fruit = fruitsToGet[index]
//       const numFruit = await getNumFruit(fruit)
//       console.log(numFruit)
//     }
  
//     console.log('End')
// }

// const sleep = ms => {
//     return new Promise(resolve => setTimeout(resolve, ms))
//   }
  
//   const getNumFruit = fruit => {
//     return sleep(1000).then(v => fruitBasket[fruit])
//   }

// forLoop()

console.log(Date.now() + (5 * 60 * 60 * 100));

console.log((1587909733065 - 1587901532857) > (3 * 60 * 60 * 100));
