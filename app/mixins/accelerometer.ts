
const DEFAULT_SENSOR_DAMPING = 0.01;


// require mixin of quit-cleaner
export default {
	created () {
		this.sensorAcceleration = [0, 0, 0];
		this.sensorVelocity = [0, 0, 0];
		this.sensorDamping = DEFAULT_SENSOR_DAMPING;

		if (typeof LinearAccelerationSensor !== "undefined") {
			navigator.permissions.query({name: "accelerometer"}).then(result => {
				//console.log("accelerometer:", result);
				if (result.state === "granted") {
					const laSensor = new LinearAccelerationSensor({frequency: 60});

					const sensorHandler = () => {
						//if (laSensor.x * laSensor.x + laSensor.y * laSensor.y + laSensor.z * laSensor.z > 0.1)
						//	console.log("la reading:", laSensor.x.toFixed(2), laSensor.y.toFixed(2), laSensor.z.toFixed(2));
						this.sensorAcceleration = [laSensor.x, laSensor.y, laSensor.z];

						this.sensorVelocity.forEach((_, i) => {
							this.sensorVelocity[i] += this.sensorAcceleration[i];
							this.sensorVelocity[i] *= (1 - this.sensorDamping);
						});
					};
					laSensor.addEventListener("reading", sensorHandler);
					this.appendCleaner(() => laSensor.removeEventListener("reading", sensorHandler));

					laSensor.start();
				}
			});
		}
	},
};
