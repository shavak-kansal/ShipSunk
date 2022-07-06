import "./style.css";
 
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import Stats from 'three/examples/jsm/libs/stats.module'
import { Camera } from "three";

const numOfEnemies = 8;
const numOfTreasure = 20;
const scene = new THREE.Scene();
const stats = new Stats();

var score = 0;
var life = 100;

let up, down, left, right, cameraOverhead;

cameraOverhead = true;

//const playerCar = Car();
//scene.add(playerCar);

var shipModel;

var enemyShipModelRef;
var enemyShipModels = [];

var canonBalls = [];

var playerCanonBalls = [];
var enemyCanonBalls = [];

var treasureModelRef;
var treasureArr = [];

var camera;
var shipPos = new THREE.Vector3(0, 0, 0);
var directionVec = new THREE.Vector3(0, -40, 75);

var clock = new THREE.Clock();

setInterval(function(){

  enemyShipModels.forEach(function(enemyShipModel){
    
    if(Math.random() > 0.5)
      shootEnemyCanon(enemyShipModel);  
  });

}, 2000);

function loadPlayerShip() {
  const loader = new GLTFLoader();
  
  loader.load("./assets/ship2/scene.gltf", function(gltf) {
    shipModel = gltf;
    shipModel.scene.scale.set(0.06, 0.06, 0.06);
    shipModel.scene.position.set(0, -1, 0);
    shipModel.scene.rotateY(Math.PI / 2);
    scene.add(shipModel.scene);    
  });

  loader.load(
    "./assets/ship1/scene.gltf",
    function (gltf) {
      
      console.log(typeof(gltf));
      
      
      enemyShipModelRef = gltf.scene.clone();

      
      document.addEventListener("keydown", onDocumentKeyDown, false);
      document.addEventListener("keyup", onDocumentKeyUp, false);

      function onDocumentKeyDown(event){

        if(event.keyCode == 87){
          up = true;
          //shootCanonBall(shipModel.scene, enemyShipModels[0]);
        }
        if(event.keyCode == 83){
          down = true;
        }
        if(event.keyCode == 65){
          right = true;
        }
        if(event.keyCode == 68){
          left = true;
        }

        if(event.keyCode == 70){
          //shootCanonBall(shipModel.scene, enemyShipModels[0]);
          shootPlayerCanon(shipModel.scene);
        }
        if(event.keyCode == 86){
          cameraOverhead = !cameraOverhead;
        }
      }

      function onDocumentKeyUp(event) {
        if (event.keyCode == 87) {
          up = false;
        }
        if (event.keyCode == 83) {
          down = false;
        }
        if (event.keyCode == 65) {
          right = false;
        }
        if (event.keyCode == 68) {
          left = false;
        }
      }
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );

  loader.load("./assets/tc2/scene.gltf", function (gltf) {
    treasureModelRef = gltf.scene.clone();
    treasureModelRef.scale.set(1, 1, 1);
    treasureModelRef.position.set(0, -1, 0);
  });
}

function shootCanonBall(one, two, life = 400) {
  
  var canonBall = new THREE.Mesh(
    new THREE.SphereGeometry(5, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );


  canonBall.position.set(one.position.x, one.position.y + 5, one.position.z);
  
  var velocityBall = new THREE.Vector3(two.position.x-one.position.x, two.position.y-one.position.y, two.position.z-one.position.z);

  velocityBall = velocityBall.normalize();
  
  canonBall.userData = {
    distanceLeft: life,
    velocity: new THREE.Vector3(velocityBall.x, velocityBall.y, velocityBall.z)
  };

  //console.log("velocity: ");
  //console.log(canonBall.userData.velocity);
  scene.add(canonBall);

  canonBalls.push(canonBall);
}

function shootPlayerCanon(one){
  var canonBall = new THREE.Mesh(
    new THREE.SphereGeometry(3, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );

  canonBall.position.set(one.position.x, one.position.y + 5, one.position.z);
  canonBall.userData = {
    distanceLeft: 400,
    velocity: new THREE.Vector3(0, 0, 1)
  };

  scene.add(canonBall);
  playerCanonBalls.push(canonBall);
}

function shootEnemyCanon(one){
  var canonBall = new THREE.Mesh(
    new THREE.SphereGeometry(3, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );

  var directionVec = new THREE.Vector3(shipPos.x - one.position.x, shipPos.y - one.position.y , shipPos.z - one.position.z);
  directionVec = directionVec.normalize();

  canonBall.position.set(one.position.x + 10, one.position.y + 7, one.position.z+ 10);
  canonBall.userData = {
    distanceLeft: 1000,
    velocity: directionVec
  };

  scene.add(canonBall);
  enemyCanonBalls.push(canonBall);
}

function handleCollisions() {

  enemyCanonBalls.forEach(function(canonBall, index){
    const ballPos = new THREE.Vector3(canonBall.position.x, canonBall.position.y, canonBall.position.z);
    
    if (ballPos.distanceTo(shipPos) < 40) {
      console.log("collision with ship");
      scene.remove(canonBall);
      enemyCanonBalls.splice(index, 1);
      life -= 1;
    }
  });

  playerCanonBalls.forEach(function(canonBall, index){
    const ballPos = new THREE.Vector3(canonBall.position.x, canonBall.position.y, canonBall.position.z);

    enemyShipModels.forEach(function(enemyShipModel, index1){
      const enemyPos = new THREE.Vector3(enemyShipModel.position.x, enemyShipModel.position.y, enemyShipModel.position.z);
      if (ballPos.distanceTo(enemyPos) < 40) {
        scene.remove(canonBall);
        scene.remove(enemyShipModel);
        score += 1;
        enemyShipModels.splice(index1, 1);
        playerCanonBalls.splice(index, 1);
      }
    });
  });
  treasureArr.forEach(function(treasure, index, list){
    var treasurePos = new THREE.Vector3(treasure.position.x, treasure.position.y, treasure.position.z);
    
    enemyShipModels.forEach(function(enemyShipModel, index1, list1){
      var enemyPos = new THREE.Vector3(enemyShipModel.position.x, enemyShipModel.position.y, enemyShipModel.position.z);
      if (treasurePos.distanceTo(enemyPos) < 30) {
        scene.remove(enemyShipModel);
        list1.splice(index1, 1);
      }
    });

    if(shipPos.distanceTo(treasurePos) < 30){
      console.log("collision");
      scene.remove(treasure);
      list.splice(index, 1);

      score += 5;
    }
  });

  enemyShipModels.forEach(function(enemyShipModel1, index1, list){
    enemyShipModels.forEach(function(enemyShipModel2, index2, list2){
      if(index1 != index2){
        const pos1 = new THREE.Vector3(enemyShipModel1.position.x, enemyShipModel1.position.y, enemyShipModel1.position.z);
        const pos2 = new THREE.Vector3(enemyShipModel2.position.x, enemyShipModel2.position.y, enemyShipModel2.position.z);

        const xdist = pos2.z - pos1.z;
        const ydist = pos2.x - pos1.x;

        if(( (-60 < xdist) && ( xdist < 30 ) ) && ( ( -20 < ydist ) && ( ydist < 20 ) )){
          scene.remove(enemyShipModel1);
          enemyShipModels.splice(index1, 1);

          //scene.remove(enemyShipModel2);
          //enemyShipModels.splice(index2, 1);
        }
      }
    });
  });


}

function resetScene(canvas) {

  canvas.appendChild(stats.dom);
  const renderer = buildRenderer(canvas);
  createCamera();

  // const cgui = new GUI();
  // const playerStatsGUI = cgui.addFolder("Stats");
  // playerStatsGUI.add(life, "Lives Left", 0);
  // playerStatsGUI.add(score, "Score", 0);
  // playerStatsGUI.open();

  const sky = buildSky();
  const water = buildWater();

  const mainLight = new THREE.DirectionalLight("white", 1);
  mainLight.position.set(1, 1, 0);
  scene.add(mainLight);

  const ambLight = new THREE.AmbientLight("white", 0.5);
  scene.add(ambLight);

  function createCamera(){
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 20000);
    //camera.position.set(0, 200, -200);
    camera.position.set(0, -directionVec.y, -directionVec.z);
    camera.lookAt(0, 1, 100);

    //camera.lookAt(shipModel.scene.position);
    // const controls = new OrbitControls(camera, renderer.domElement);
    // controls.maxPolarAngle = Math.PI * 0.495;
    // controls.target.set(0, 0, 0);
    // controls.minDistance = 40.0;
    // controls.maxDistance = 200.0;
    // controls.update();
  }

  function buildRenderer(canvas) {
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvas.appendChild(renderer.domElement);
    return renderer;
  }

  function buildSky() {
    const sky = new Sky();
    sky.scale.setScalar(450000);
    scene.add(sky);
    
    const sun = new THREE.Vector3();
    sun.x = 1;
    sun.y = 0;
    sun.z = 1;

    sky.material.uniforms["sunPosition"].value.copy(sun);

    return sky;
  }

  function buildWater() {
    const waterGeometry = new THREE.PlaneGeometry(40000, 40000);
    const water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load(
        "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg",
        function (texture) {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }
      ),
      alpha: 1.0,
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: scene.fog !== undefined,
    });
    water.rotation.x = -Math.PI / 2;
    scene.add(water);
    return water;
  }

  function playerMove(){

    const playerShipSpeed = 0.3;

    var rotationVec = new THREE.Vector2(0, 0);

    var oldPos = new THREE.Vector3(shipPos);

    if(up){
      shipModel.scene.position.z += playerShipSpeed;
      rotationVec.y ++;
    }
    if(down){
      shipModel.scene.position.z -= playerShipSpeed;
      rotationVec.y --;

    }
    if(right){
      shipModel.scene.position.x += playerShipSpeed;
      rotationVec.x ++;
    }
    if(left){
      shipModel.scene.position.x -= playerShipSpeed;
      rotationVec.x --;
    }

    enemyShipModels.forEach(function(enemyShipModel){
      const enemy = new THREE.Vector3(enemyShipModel.position.x, enemyShipModel.position.y, enemyShipModel.position.z);
      const ship = new THREE.Vector3(shipModel.scene.position.x, shipModel.scene.position.y, shipModel.scene.position.z);
      
      const xdist = ship.z - enemy.z;
      const ydist = ship.x - enemy.x;

      if(( (-90 < xdist) && ( xdist < 25 ) ) && ( ( -15 < ydist ) && ( ydist < 15 ) )){
        if(up){
          shipModel.scene.position.z -= playerShipSpeed;
          rotationVec.y ++;
        }
        if(down){
          shipModel.scene.position.z += playerShipSpeed;
          rotationVec.y --;
    
        }
        if(right){
          shipModel.scene.position.x -= playerShipSpeed;
          rotationVec.x ++;
        }
        if(left){
          shipModel.scene.position.x += playerShipSpeed;
          rotationVec.x --;
        }
      }
    });
    
    shipPos.set(shipModel.scene.position.x, shipModel.scene.position.y, shipModel.scene.position.z);
  }

  function enemyMove(){
    const enemySpeed = 0.18;

    enemyShipModels.forEach(function (enemyShipModel) {
      const enemyPos1 = new THREE.Vector3(enemyShipModel.position.x, enemyShipModel.position.y, enemyShipModel.position.z);

      if (enemyPos1.distanceTo(shipPos) < 200) {
        ;
      } 
      else {
        var velo = new THREE.Vector3(shipPos.x - enemyPos1.x, shipPos.y - enemyPos1.y, shipPos.z - enemyPos1.z);

        velo = velo.normalize();
        
        enemyShipModels.forEach(function (enemyShipModel2) {
          const enemyPos2 = new THREE.Vector3(enemyShipModel2.position.x, enemyShipModel2.position.y, enemyShipModel2.position.z);

          if (enemyPos2.distanceTo(enemyPos1) < 50) {
            var vel1 = new THREE.Vector3(0, 0, 0);
            vel1.x = -(enemyPos2.x - enemyPos1.x)*6;
            vel1.y = -(enemyPos2.y - enemyPos1.y)*6;
            vel1.z = -(enemyPos2.z - enemyPos1.z)*6;    
            
            velo.add(vel1);
          }
        });
        velo = velo.normalize();

        enemyShipModel.position.x += enemySpeed * velo.x;
        enemyShipModel.position.y += enemySpeed * velo.y;
        enemyShipModel.position.z += enemySpeed * velo.z;

      }
    });
  }

  function canonBallMove(){
    const canonBallSpeed = 1;

    playerCanonBalls.forEach(function (canonBall, index, array) {
      canonBall.position.x += canonBall.userData.velocity.x*canonBallSpeed;
      canonBall.position.y += canonBall.userData.velocity.y*canonBallSpeed;
      canonBall.position.z += canonBall.userData.velocity.z*canonBallSpeed;

      canonBall.userData.distanceLeft -= canonBallSpeed;
      
      if(canonBall.userData.distanceLeft <= 0){
        scene.remove(canonBall);
        playerCanonBalls.splice(index, 1);
      }
    });

    enemyCanonBalls.forEach(function (canonBall, index, array) {
      canonBall.position.x += canonBall.userData.velocity.x*canonBallSpeed;
      canonBall.position.y += canonBall.userData.velocity.y*canonBallSpeed;
      canonBall.position.z += canonBall.userData.velocity.z*canonBallSpeed;

      canonBall.userData.distanceLeft -= canonBallSpeed;
      
      if(canonBall.userData.distanceLeft <= 0){
        scene.remove(canonBall);
        enemyCanonBalls.splice(index, 1);
      }
    });
  }

  function handleCamera(){
    if(cameraOverhead){
      camera.position.set(shipPos.x, shipPos.y + 400, shipPos.z);
      camera.up.set(0, 0, 1);
      camera.lookAt(shipPos);
    }
    else {
      camera.position.set(shipPos.x - directionVec.x, shipPos.y - directionVec.y, shipPos.z - directionVec.z);
      camera.up.set(0, 1, 0);
      camera.lookAt(shipPos);
    }
  }

  function floatingTreasures(){
    const time = performance.now() * 0.0015;
  
    treasureArr.forEach(function(treasure){
      treasure.position.y = -3 + Math.sin(time) * 2;
    });
  }

  function genEnemies(){
    while(enemyShipModels.length < numOfEnemies){
      var cloned = enemyShipModelRef.clone();
  
      cloned.position.set( Math.random() * 1000 + 50, -1, Math.random() * 1000 + 50 );
      cloned.scale.set(0.09, 0.09, 0.09);
      
      enemyShipModels.push(cloned);
      scene.add(cloned);
    }
  }
  
  function genTreasures(){
    while(treasureArr.length < numOfTreasure){
      var cloned = treasureModelRef.clone();
      
      var angle = Math.random() * Math.PI * 2;
      var dis = Math.random() * 500 + 250;
      var x = Math.cos(angle) * dis + shipPos.x;
      var y = Math.sin(angle) * dis + shipPos.y;
      
      cloned.position.set(y,0, x);
      cloned.rotateY(Math.random() * Math.PI * 2);
      treasureArr.push(cloned);
      scene.add(cloned);
    }
  }

  this.update = function () {
    water.material.uniforms["time"].value += 1.0 / 60.0;
    playerMove();
    enemyMove();  
    canonBallMove();
    genEnemies();
    genTreasures();

    floatingTreasures();
    handleCollisions();
    handleCamera();
    
    document.getElementById("Score").innerHTML = "Score: " + score;
    document.getElementById("LivesLeft").innerHTML = "Lives Left: " + life;

    let sec = clock.getElapsedTime();
    sec = parseInt(sec);
    document.getElementById("Time").innerHTML = "Time Passed: " + sec;

    renderer.render(scene, camera);
    stats.update();
  };

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener("resize", onWindowResize);
  
}

const canvas = document.getElementById("canvas");

loadPlayerShip();
const plswork = new resetScene(canvas);

function animate() {
  requestAnimationFrame(animate);
  plswork.update();
}

animate();
