/* global createButtonGroup createModalButton createModal keyUpHandler canvas ctx label addPause loop paintCircle getDistance generateRandomNumber */
const defaultInitialPercentages = [20, 79, 1, 0, 0, 0, 0, 0, 0, 0];
const initialPercentages = new Array(10);

const person = {
  highestDeathRate: 0.00006,
  highestInpatientRecoveryTime: 350,
  highestOutpatientRecoveryTime: 700,
  lowestDeathRate: 0.00002,
  lowestInpatientRecoveryTime: 250,
  lowestOutpatientRecoveryTime: 500,
  recoveredRepeatedInfection: true,
  speed: 2,
  radius: 5,
  colors: ['#00D000', '#00D000', '#FFC000', '#FFC000', '#FF00FF', '#FF0000', '#FF0000', '#00B0FF', '#00B0FF', '#000000'],
  labels: ['Healthy active', 'Healthy isolated', 'Infected active', 'Infected isolated', 'Inpatient', 'Outpatient active', 'Outpatient isolated', 'Recovered active', 'Recovered isolated', 'Dead']
};

let population = canvas.width * canvas.height / 1500;
const testDelay = 300;
const testCapacity = 0.0005;
const hospitalCapacity = 0.2;

let testDelayCount = 0;
const counts = new Array(10);
let people = [];

const modalElements = [[['Healthy active %', 'percentage1', 0, 100, 'number'], ['Healthy isolated %', 'percentage2', 0, 100, 'number']], [['Infected active %', 'percentage3', 0, 100, 'number'], ['Infected isolated %', 'percentage4', 0, 100, 'number']], [['Inpatient %', 'percentage5', 0, 100, 'number'], ['Outpatient active %', 'percentage6', 0, 100, 'number']], [['Outpatient isolated %', 'percentage7', 0, 100, 'number'], ['Recovered active %', 'percentage8', 0, 100, 'number']], [['Recovered isolated %', 'percentage9', 0, 100, 'number'], ['Dead %', 'percentage10', 0, 100, 'number']]];
const buttonElements = [['info', 'restart()', 'r', 'sync', '<u>R</u>estart'], ['info', '', 's', 'cog', '<u>S</u>ettings']];
const buttonGroup = createButtonGroup('btn-group btn-group-lg btn-group-center', buttonElements);
document.body.insertBefore(createModalButton(buttonGroup, 1), canvas);
createModal(modalElements);

resetInputs();
restart();
addPause();
document.addEventListener('keyup', keyUpHandler);
window.addEventListener('resize', resizeHandler);

loop(function (frames) {
  testDelayCount += frames;
  let testCount = 0;
  const testLimit = testDelayCount < testDelay ? 0 : testCapacity * frames * population;
  const hospitalLimit = hospitalCapacity * population;
  for (const p of people) {
    paintCircle(p.x, p.y, person.radius, person.colors[p.state]);
    testCount = updatePerson(p, frames, testCount, testLimit, hospitalLimit);
  }
  ctx.fillStyle = 'rgba(225, 225, 225, 0.8)';
  ctx.fillRect(0, 0, 290, 310);
  ctx.font = label.font;
  for (const i in person.colors) {
    ctx.fillStyle = person.colors[i];
    ctx.fillText(`${person.labels[i]}: ${counts[i]}`, label.left, (+i + 1) * label.margin);
  }
});

function resetInputs () {
  for (let i = 0; i < initialPercentages.length; i++) {
    document.getElementById(`percentage${i + 1}`).value = (initialPercentages[i] = defaultInitialPercentages[i]);
  }
}

window.save = function () {
  for (let i = 0; i < initialPercentages.length; i++) {
    initialPercentages[i] = document.getElementById(`percentage${i + 1}`).value;
  }
};

function restart () {
  testDelayCount = 0;
  counts.fill(0);
  people = [];
  for (let i in initialPercentages) {
    i = +i;
    for (let j = 0; j < Math.floor(initialPercentages[i] * population / 100); j++) {
      let x;
      let y;
      let intersects;
      do {
        x = generateRandomNumber(person.radius, canvas.width - person.radius);
        y = generateRandomNumber(person.radius, canvas.height - person.radius);
        intersects = false;
        for (const other of people) {
          if (getDistance({ x, y }, other) < 2 * person.radius) {
            intersects = true;
            break;
          }
        }
      } while (intersects);
      let speedX;
      let speedY;
      if (i === 0 || i === 2 || i === 5 || i === 7) {
        speedX = generateRandomNumber(-1, 1);
        speedY = generateRandomNumber(-1, 1);
        const norm = Math.sqrt(speedX ** 2 + speedY ** 2);
        speedX /= norm;
        speedY /= norm;
      } else {
        speedX = 0;
        speedY = 0;
      }
      counts[i]++;
      people.push({
        x,
        y,
        speedX,
        speedY,
        state: i,
        id: j,
        recoveryTimeCount: 0,
        deathRate: generateRandomNumber(person.lowestDeathRate, person.highestDeathRate),
        inpatientRecoveryTime: generateRandomNumber(person.lowestInpatientRecoveryTime, person.highestInpatientRecoveryTime),
        outpatientRecoveryTime: generateRandomNumber(person.lowestOutpatientRecoveryTime, person.highestOutpatientRecoveryTime)
      });
    }
  }
}

function updatePerson (p, frames, testCount, testLimit, hospitalLimit) {
  if (p.state === 0 || p.state === 2 || p.state === 5 || p.state === 7) {
    if ((p.x < person.radius && p.speedX < 0) || (p.x > canvas.width - person.radius && p.speedX > 0)) {
      p.speedX = -p.speedX;
    }
    if ((p.y < person.radius && p.speedY < 0) || (p.y > canvas.height - person.radius && p.speedY > 0)) {
      p.speedY = -p.speedY;
    }
    for (const other of people) {
      if (p.id !== other.id && getDistance(p, other) < 2 * person.radius) {
        const atan = Math.atan2(other.y - p.y, other.x - p.x);
        p.speedX = Math.cos(atan - Math.PI);
        p.speedY = Math.sin(atan - Math.PI);
        if (other.state === 0 || other.state === 2 || other.state === 5 || other.state === 7) {
          other.speedX = Math.cos(atan);
          other.speedY = Math.sin(atan);
        }
        if ((p.state === 2 || p.state === 5) && (other.state === 0 || other.state === 1 || (other.state === 7 && person.recoveredRepeatedInfection) || (other.state === 8 && person.recoveredRepeatedInfection))) {
          counts[other.state]--;
          if (other.state === 0 || other.state === 7) {
            other.state = 2;
          } else {
            other.state = 3;
          }
          counts[other.state]++;
        } else if ((p.state === 0 || (p.state === 7 && person.recoveredRepeatedInfection)) && (other.state === 2 || other.state === 3 || other.state === 4 || other.state === 5 || other.state === 6)) {
          counts[p.state]--;
          p.state = 2;
          counts[p.state]++;
        }
        break;
      }
    }
    p.x += p.speedX * person.speed * frames;
    p.y += p.speedY * person.speed * frames;
  }
  if (p.state === 2 || p.state === 3 || p.state === 4 || p.state === 5 || p.state === 6) {
    if (p.state === 2 || p.state === 3) {
      if (testCount < testLimit) {
        testCount++;
        p.recoveryTimeCount = 0;
        counts[p.state]--;
        if (counts[4] < hospitalLimit) {
          p.state = 4;
        } else {
          if (p.state === 2) {
            p.state = 5;
          } else {
            p.state = 6;
          }
        }
        counts[p.state]++;
      }
    } else {
      const recoveryTime = p.state === 4 ? p.inpatientRecoveryTime : p.outpatientRecoveryTime;
      if (p.recoveryTimeCount > recoveryTime) {
        counts[p.state]--;
        if (p.state === 5) {
          p.state = 7;
        } else {
          p.state = 8;
        }
        counts[p.state]++;
      } else {
        p.recoveryTimeCount += frames;
        if (p.state !== 4 && counts[4] < hospitalLimit) {
          counts[p.state]--;
          p.state = 4;
          counts[p.state]++;
        }
      }
    }
    if (Math.random() < p.deathRate) {
      counts[p.state]--;
      p.state = 9;
      counts[p.state]++;
    }
  }
  return testCount;
}

function resizeHandler () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  population = canvas.width * canvas.height / 1500;
}
