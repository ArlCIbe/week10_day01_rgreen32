

/*
IMPORTANT

This component is expecting an array of image objects to be passed to its 'images' property. 

The array of objects should be formatted like the contents of the data.json file in the src folder

If this component isnt working as expected, its because you're not passing data to it's 'images' prop correctly.

*/



//YOU DO NOT NEED TO MODIFY THIS COMPONENT 👇*



















//YOU DO NOT NEED TO MODIFY THIS COMPONENT 👇

























//YOU DO NOT NEED TO MODIFY THIS COMPONENT 👇


























//YOU DO NOT NEED TO MODIFY THIS COMPONENT 👇





























//YOU DO NOT NEED TO MODIFY THIS COMPONENT 👇




























/* This component utilzes a library for generating 3d graphics called THREE.js
  
  Checkout the site: https://threejs.org/ 

*/



import { useEffect } from "react";
import ThreeGlobe from 'three-globe';
import * as THREE from 'three';
import { useRef } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { InteractionManager } from 'three.interactive';
import * as TWEEN from '@tweenjs/tween.js'
import { useState } from "react";
import Spinner from 'react-bootstrap/Spinner';
import Sparkles from 'react-sparkle'

import "./Globe.css"


function Globe(props) {
  const refContainer = useRef(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [globe, setGlobe] = useState(null)
  const [globeEnhanced, setGlobeEnhanced] = useState(false)
  const [world, setWorld] = useState(null)
  const [camera, setCamera] = useState(null)
  const [cameraControls, setCameraControls] = useState(null)
  const [markerFocused, setMarkerFocused] = useState(false)
  const [orbitalCameraPosition, setOribitalCameraPostion] = useState(null)
  const [internalSelectedImage, setInternalSelectedImage] = useState(null)

  //1
  useEffect(() => {
    // Setup 3D renderer
    let renderer = create3dRenderer(refContainer)

    // Setup 3D world
    let world = create3dWorld()
    setWorld(world)

    // Setup camera view of 3D world
    let camera = create3dCamera()
    setCamera(camera)

    // Add camera controls
    let cameraControls = createControls(camera, renderer)
    setCameraControls(cameraControls)
    // Other controls
    let interactionManager = new InteractionManager(renderer, camera, renderer.domElement);

    console.log("Images passed into to the globe component", props.images)
    let imageDataArray = props.images
    imageDataArray.forEach((image, index) => {
      image.id = index
      image.size = 0.04
      image.color = "#ffff00"
      image.radius = 1.7
      image.altitude = 0
    })

    // Create 3D Globe object
    let Globe = createGlobe3dObject(imageDataArray)

    Globe.customThreeObjectUpdate((marker3dObject, ImageDataObject) => {
      //Convert latitude, longitude and altitude values of marker to X, Y, and Z position values
      let marker3dCoordinates = Globe.getCoords(ImageDataObject.latitude, ImageDataObject.longitude, ImageDataObject.altitude)

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
        console.log("clicked a marker...", ImageDataObject)

        setInternalSelectedImage(ImageDataObject)
        setMarkerFocused(true)
      });

      animate3dMarker(marker3dObject, marker3dCoordinates, ImageDataObject.latitude)

      interactionManager.add(marker3dObject);
    });
    world.add(Globe);

    // Create 3D clouds object
    let clouds3dObject = createClouds3dObject(Globe.getGlobeRadius())


    // Add 3D clouds to 3D world when globe is ready
    Globe.onGlobeReady(() => {
      setGlobe(Globe)
      setGlobeReady(true)
      world.add(clouds3dObject);
    });


    // start animation loop (How is this a loop? Answer: recursion)
    function animate() {
      cameraControls.update()
      interactionManager.update();
      clouds3dObject.rotation.y += (-0.002 * Math.PI / 180) * 10;
      renderer.render(world, camera);
      requestAnimationFrame(animate); //look up the requestAnimationFrame function see where it leads you :)
    }
    animate();


    // Register the event listener for the resize event
    window.addEventListener('resize', () => {
      // Check if the renderer and camera are initialized
      if (renderer && camera) {
        const { width, height } = refContainer.current.getBoundingClientRect();

        // Update renderer size to match the globe container's dimensions
        renderer.setSize(width, height);

        // Update camera aspect ratio and recompute the projection matrix
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    });

    return () => {
      refContainer.current.removeChild(renderer.domElement);
    };
  }, []);

  //2
  useEffect(() => {
    if (globeReady) {
      let imageDataArray = props.images
      imageDataArray.forEach((image, index) => {
        image.id = index
        image.size = 0.04
        image.color = "#ffff00"
        image.radius = 1.7
        image.altitude = 0
      })
      globe.customLayerData(props.images)
    }
  }, [props.images])

  //3
  useEffect(() => {
    if (camera) {
      // Create a tween for smoothly transitioning the camera position
      let tween = new TWEEN.Tween(camera.position)
      if (markerFocused) {
        // Store the current camera position as the orbital position when a marker is focused
        setOribitalCameraPostion({ ...camera.position });
        let targetCameraPosition = globe.getCoords(internalSelectedImage.latitude, internalSelectedImage.longitude, 1);
        tween.to(targetCameraPosition, 1000)
          .easing(TWEEN.Easing.Quadratic.Out)
          .onUpdate(() => {
            camera.position.set(camera.position.x, camera.position.y, camera.position.z);
          })
          .onComplete(() => {
            props.setSelectedImage(internalSelectedImage);
            cameraControls.autoRotate = false;
            cameraControls.saveState()
          })
          .start();
      } else {
        // Ensure there is a stored orbital position before zooming out
        if (orbitalCameraPosition) {
          tween.to(orbitalCameraPosition, 800)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(() => {
              camera.position.set(camera.position.x, camera.position.y, camera.position.z);
            })
            .onComplete(() => {
              cameraControls.autoRotate = true;
              cameraControls.saveState()
            })
            .start();
        }
      }

      function animate(time) {
        requestAnimationFrame(animate);
        TWEEN.update(time);
      }
      animate();
    }
  }, [markerFocused]);

  //4 useEffects statements???? this is nuts
  useEffect(() => {
    if (props.selectedImage == null) {
      setMarkerFocused(false)
    } else {
      setInternalSelectedImage(props.selectedImage)
      setMarkerFocused(true)
    }

  }, [props.selectedImage])

  return <div>
    <div id="globeContainer" ref={refContainer}>
      <Spinner id="globeLoadingIcon" style={{ visibility: globeReady == false ? "visible" : "hidden" }} animation="border" letiant="secondary" />
      <button
        id="enhanceButton"
        onClick={() => {
          if (!globeEnhanced) {
            // Create 3D stars object
            let stars3dObject = createStars3dObject()
            world.add(stars3dObject);
            setGlobeEnhanced(true)
          }
        }}>
        {globeEnhanced != true ? <Sparkles /> : <></>}
        Enhance
      </button>
    </div>
  </div>

}

export default Globe;

















function create3dRenderer(referenceContainer) {
  let renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  let rect = referenceContainer.current.getBoundingClientRect();


  renderer.setSize(rect.width, rect.height);
  if (referenceContainer.current) {
    referenceContainer.current.appendChild(renderer.domElement);
  }
  return renderer;
}

function create3dWorld() {
  let scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xcccccc, Math.PI));
  scene.add(new THREE.DirectionalLight(0xffffff, 0.6 * Math.PI));
  return scene;
}

function create3dCamera() {
  let camera = new THREE.PerspectiveCamera();
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  camera.position.z = 300;

  return camera;
}

function createControls(camera, renderer) {
  let controls = new OrbitControls(camera, renderer.domElement);
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
  let startingCoordinates = { x: marker3dCoordinates.x, y: marker3dCoordinates.y, z: marker3dCoordinates.z }
  if (markerLatitude >= 0) {
    startingCoordinates.y = startingCoordinates.y + 300
  } else if (markerLatitude < 0) {
    startingCoordinates.y = startingCoordinates.y - 300
  }
  let tween = new TWEEN.Tween(startingCoordinates)
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
  let cloudsObject = new THREE.Mesh(new THREE.SphereGeometry(globeRadius * (1 + 0.004), 75, 75));
  new THREE.TextureLoader().load("./clouds.png", cloudsTexture => {
    cloudsObject.material = new THREE.MeshPhongMaterial({ map: cloudsTexture, transparent: true });
  });
  return cloudsObject;
}

function createStars3dObject() {
  let backgroundObject = new THREE.Mesh(new THREE.SphereGeometry(1000, 15, 15))
  new THREE.TextureLoader().load("./background.png", starsTexture => {
    backgroundObject.material = new THREE.MeshPhongMaterial({ map: starsTexture, side: THREE.BackSide });
  });

  return backgroundObject
}

function createGlobe3dObject(markers) {
  let globeObject = new ThreeGlobe()
    .globeImageUrl('./map.jpg')
    .bumpImageUrl('./bumpmap.jpg')
    .customLayerData(markers)
    .customThreeObject(d => {
      let markerSphereMesh = new THREE.Mesh(new THREE.SphereGeometry(d.radius), new THREE.MeshLambertMaterial({ color: d.color }))
      return markerSphereMesh
    })


  return globeObject;
}

