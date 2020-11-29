
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";



const main = (filename: string) => {
	const loader = new GLTFLoader();
	loader.load( filename, function ( gltf ) {
		console.log("gltf:", gltf);
	}, undefined, console.error.bind(console));
};


main(process.argv[1]);
