let instance: any = null;
let pending: Promise<any> | null = null;

export const loadOpenCV = (wasmBinaryFile: string): Promise<any> => {
	if (instance) return Promise.resolve(instance);
	if (!pending) {
		pending = import("../public/opencv.js").then((module: any) => module.loadOpenCV(wasmBinaryFile)).then(value => {
			instance = value;
			return value;
		});
	}
	return pending;
};
