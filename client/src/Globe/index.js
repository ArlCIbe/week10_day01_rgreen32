import { useEffect } from "react";
import ThreeGlobe from 'three-globe';
import * as THREE from 'three';
import {  useRef } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { InteractionManager } from 'three.interactive';
import * as TWEEN from '@tweenjs/tween.js'
import imageDataArray from "./data.json"
import { useState } from "react";
import Spinner from 'react-bootstrap/Spinner';


import "./Globe.css"
import ImageViewer from "./ImageViewer";


function Globe(props) {
    const refContainer = useRef(null);
    const [globeReady, setGlobeReady] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
      // Setup 3D renderer
      const renderer = create3dRenderer(refContainer)
      // Setup 3D world
      const world = create3dWorld()
      // Setup camera view of 3D world
      const camera = create3dCamera()
      // Add camera controls
      const cameraControls = createControls(camera, renderer)
      // Other controls
      const interactionManager = new InteractionManager(renderer, camera, renderer.domElement);

        
      imageDataArray.forEach((image, index) => {
        image.id = index
        image.size = 0.04
        image.color = "#ffff00"
        image.radius = 1.7
        image.altitude = 0
      })

      // Create 3D Globe object
      const Globe = createGlobe3dObject(imageDataArray)

      Globe.customThreeObjectUpdate((marker3dObject, ImageDataObject) => {
        //Convert latitude, longitude and altitude values of marker to X, Y, and Z position values
        var marker3dCoordinates = Globe.getCoords(ImageDataObject.latitude, ImageDataObject.longitude, ImageDataObject.altitude)
        
        //Set the position of the 3d marker object to the calculated position
        marker3dObject.position.x = marker3dCoordinates.x
        marker3dObject.position.y = marker3dCoordinates.y
        marker3dObject.position.z = marker3dCoordinates.z

        //When mouse is over 3d marker object, change color to red and cursor style to pointer
        marker3dObject.addEventListener('mouseover', (event) => {
          event.target.material.color.set(0xff0000);
          document.body.style.cursor = 'pointer';
        });

        //When mouse exits its hover position over 3d marker object, change color back to yellow and cursor style to default
        marker3dObject.addEventListener('mouseout', (event) => {
          event.target.material.color.set(0xffff00);
          document.body.style.cursor = 'default';
        });
        
        //Add onclick event listener to the 3d marker object
        marker3dObject.addEventListener('click', (event) => {
          console.log("clicked...")
          console.log(ImageDataObject)
          setSelectedImage(ImageDataObject)
        });

        animate3dMarker(marker3dObject, marker3dCoordinates, ImageDataObject.latitude)

        interactionManager.add(marker3dObject);
      });
      world.add(Globe);
      
      // Create 3D clouds object
      const clouds3dObject = createClouds3dObject(Globe.getGlobeRadius())
      // Add 3D clouds object to 3D world when globe is ready
      Globe.onGlobeReady(() => {
        setGlobeReady(true)
        world.add(clouds3dObject);
      });


      // start animation loop
      function animate() {
        cameraControls.update()
        interactionManager.update();
        clouds3dObject.rotation.y += (-0.006 * Math.PI / 180) * 10;  
        renderer.render(world, camera);
        requestAnimationFrame(animate);
      }
      animate();

      return () => {
          refContainer.current.removeChild(renderer.domElement);
      };
    }, []);

    return <div>
              <div id="globeContainer" ref={refContainer}>
                <Spinner id="globeLoadingIcon" style={{visibility: globeReady == false ? "visible" : "hidden"}} animation="border" variant="secondary" />
                </div>
              <ImageViewer image={selectedImage} setImage={setSelectedImage} />
           </div>

}

export default Globe;

















function create3dRenderer(referenceContainer) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  var rect = referenceContainer.current.getBoundingClientRect();

  
  renderer.setSize(rect.width, rect.height);
  if (referenceContainer.current) {
    referenceContainer.current.appendChild(renderer.domElement);
  }
  return renderer;
}

function create3dWorld() {
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xcccccc, Math.PI));
  scene.add(new THREE.DirectionalLight(0xffffff, 0.6 * Math.PI));
  return scene;
}

function create3dCamera() {
  const camera = new THREE.PerspectiveCamera();
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  camera.position.z = 250;  
  return camera;
}

function createControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotate = true;
  controls.autoRotateSpeed = -.3;
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.maxDistance = 800;
  controls.zoomSpeed = 0.8;
  controls.rotateSpeed = 1.2;
  controls.minZoom = 300;
  controls.saveState();
  return controls;
}

function animate3dMarker(marker3dObject, marker3dCoordinates, markerLatitude) {
  var startingCoordinates = {x: marker3dCoordinates.x, y: marker3dCoordinates.y, z: marker3dCoordinates.z}
  if (markerLatitude >= 0) {
    startingCoordinates.y = startingCoordinates.y + 300
  }else if (markerLatitude < 0) {
    startingCoordinates.y = startingCoordinates.y - 300
  }
  const tween = new TWEEN.Tween(startingCoordinates)
                      .to(marker3dCoordinates, 2000)
                      .easing(TWEEN.Easing.Quadratic.Out)
                      .onUpdate(() => {
                        marker3dObject.position.x = startingCoordinates.x
                        marker3dObject.position.y = startingCoordinates.y
                        marker3dObject.position.z = startingCoordinates.z
                      })
                      .start()
  function animate(time) {
    TWEEN.update(time);
    requestAnimationFrame(animate);
  }
  animate();
}

function createClouds3dObject(globeRadius) {
  const cloudsObject = new THREE.Mesh(new THREE.SphereGeometry(globeRadius * (1 + 0.004), 75, 75));
  new THREE.TextureLoader().load("./clouds.png", cloudsTexture => {
    cloudsObject.material = new THREE.MeshPhongMaterial({ map: cloudsTexture, transparent: true });
  });
  return cloudsObject;
}

function createGlobe3dObject(markers) {
  const globeObject = new ThreeGlobe()
                          .globeImageUrl('./map.jpg')
                          .bumpImageUrl('./bumpmap.jpg')
                          .customLayerData(markers)
                          .customThreeObject(d => {
                            var markerSphereMesh = new THREE.Mesh(new THREE.SphereGeometry(d.radius), new THREE.MeshLambertMaterial({color: d.color}))
                            return markerSphereMesh
                          })

  globeObject.rotateY(98 * Math.PI / 180);
  globeObject.rotateZ(28 * Math.PI / 180);
  return globeObject;
}

