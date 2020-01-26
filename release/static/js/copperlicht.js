/**
 * CopperLicht 3D Engine, Copyright by Nikolaus Gebhardt, Ambiera e.U.
 * For license details, see www.ambiera.com/copperlicht
 * For the full source, see http://www.ambiera.com/copperlicht/license.html#commercial
 *
 * Note: This library can be further minificated to less then 100 KB from the full source,
 * but it isn't here to make debugging easier.
 */
var CL3D = {};
CL3D.DebugOutput = function (b) {
	this.DebugRoot = null;
	var d = document.getElementById(b);
	if (d == null) {
		CL3D.gCCDebugInfoEnabled = false;
		return;
	}
	this.DebugRoot = d.parentNode;
	if (this.DebugRoot) {
		this.LoadingRoot = document.createElement("div");
		this.DebugRoot.appendChild(this.LoadingRoot);
		var a = document.createTextNode("Loading...");
		this.LoadingRootText = a;
		this.LoadingRoot.appendChild(a);
	}
};
CL3D.DebugOutput.prototype.print = function (a) {
	if (CL3D.gCCDebugInfoEnabled == false) {
		return;
	}
	this.printInternal(a, false);
};
CL3D.DebugOutput.prototype.setLoadingText = function (a) {
	if (!this.LoadingRoot) {
		return;
	}
	if (a == null) {
		this.LoadingRoot.style.display = "none";
	} else {
		this.LoadingRoot.style.display = "block";
		this.LoadingRootText.nodeValue = a;
	}
};
CL3D.DebugOutput.prototype.printError = function (b, a) {
	this.printInternal(b, true, a);
};
CL3D.DebugOutput.prototype.printInternal = function (e, d, b) {
	if (CL3D.gCCDebugInfoEnabled == false && d != true) {
		return;
	}
	if (console) {
		if (d)
			console.error(e);
		else
			console.log(e);
	}
	if (b) {
		this.DebugRoot.appendChild(document.createElement("br"));
		var a = document.createElement("div");
		this.DebugRoot.appendChild(a);
		a.innerHTML = e;
	} else {
		this.DebugRoot.appendChild(document.createElement("br"));
		var c = document.createTextNode(e);
		this.DebugRoot.appendChild(c);
	}
};
CL3D.gCCDebugInfoEnabled = true;
CL3D.gCCDebugOutput = null;
CL3D.CCFileLoader = function (a) {
	this.FileToLoad = a;
	this.xmlhttp = false;
	if (!this.xmlhttp && typeof XMLHttpRequest != "undefined") {
		try {
			this.xmlhttp = new XMLHttpRequest();
		} catch (b) {
			this.xmlhttp = false;
		}
	}
	if (!this.xmlhttp && window.createRequest) {
		try {
			this.xmlhttp = window.createRequest();
		} catch (b) {
			this.xmlhttp = false;
		}
	}
	this.load = function (c) {
		if (this.xmlhttp == false) {
			CL3D.gCCDebugOutput.printError("Your browser doesn't support AJAX");
			return;
		}
		var d = this;
		try {
			this.xmlhttp.open("GET", this.FileToLoad, true);
		} catch (f) {
			CL3D.gCCDebugOutput.printError("Could not open file " + this.FileToLoad + ": " + f.message);
			return;
		}
		var d = this;
		this.xmlhttp.onreadystatechange = function () {
			if (d.xmlhttp.readyState == 4) {
				if (d.xmlhttp.status != 200 && d.xmlhttp.status != 0 && d.xmlhttp.status != null) {
					CL3D.gCCDebugOutput.printError("Could not open file " + d.FileToLoad + " (status:" + d.xmlhttp.status + ")");
				}
				c(d.xmlhttp.responseText);
			}
		};
		try {
			this.xmlhttp.send(null);
		} catch (f) {
			CL3D.gCCDebugOutput.printError("Could not open file " + d.FileToLoad);
			return;
		}
	};
	this.loadComplete = function (c) {
		alert("loaded :" + c);
	}
};
CL3D.PI = 3.14159265359;
CL3D.RECIPROCAL_PI = 1 / 3.14159265359;
CL3D.HALF_PI = 3.14159265359 / 2;
CL3D.PI64 = 3.141592653589793;
CL3D.DEGTORAD = 3.14159265359 / 180;
CL3D.RADTODEG = 180 / 3.14159265359;
CL3D.TOLERANCE = 1e-8;
CL3D.radToDeg = function (a) {
	return a * CL3D.RADTODEG;
};
CL3D.degToRad = function (a) {
	return a * CL3D.DEGTORAD;
};
CL3D.iszero = function (b) {
	return (b < 1e-8) && (b > -1e-8);
};
CL3D.isone = function (b) {
	return (b + 1e-8 >= 1) && (b - 1e-8 <= 1);
};
CL3D.equals = function (d, c) {
	return (d + 1e-8 >= c) && (d - 1e-8 <= c);
};
CL3D.clamp = function (c, a, b) {
	if (c < a) {
		return a;
	}
	if (c > b) {
		return b;
	}
	return c;
};
CL3D.fract = function (a) {
	return a - Math.floor(a);
};
CL3D.max3 = function (e, d, f) {
	if (e > d) {
		if (e > f) {
			return e;
		}
		return f;
	}
	if (d > f) {
		return d;
	}
	return f;
};
CL3D.min3 = function (e, d, f) {
	if (e < d) {
		if (e < f) {
			return e;
		}
		return f;
	}
	if (d < f) {
		return d;
	}
	return f;
};
CL3D.getAlpha = function (a) {
	return ((a & 4278190080) >>> 24);
};
CL3D.getRed = function (a) {
	return ((a & 16711680) >> 16);
};
CL3D.getGreen = function (a) {
	return ((a & 65280) >> 8);
};
CL3D.getBlue = function (a) {
	return ((a & 255));
};
CL3D.createColor = function (d, f, e, c) {
	d = d & 255;
	f = f & 255;
	e = e & 255;
	c = c & 255;
	return (d << 24) | (f << 16) | (e << 8) | c;
};
CL3D.CLTimer = function () {};
CL3D.CLTimer.getTime = function () {
	var a = new Date();
	return a.getTime();
};
CL3D.Vect3d = function (a, c, b) {
	if (a == null) {
		this.X = 0;
		this.Y = 0;
		this.Z = 0;
	} else {
		this.X = a;
		this.Y = c;
		this.Z = b;
	}
};
CL3D.Vect3d.prototype.X = 0;
CL3D.Vect3d.prototype.Y = 0;
CL3D.Vect3d.prototype.Z = 0;
CL3D.Vect3d.prototype.set = function (a, c, b) {
	this.X = a;
	this.Y = c;
	this.Z = b;
};
CL3D.Vect3d.prototype.clone = function () {
	return new CL3D.Vect3d(this.X, this.Y, this.Z);
};
CL3D.Vect3d.prototype.copyTo = function (a) {
	a.X = this.X;
	a.Y = this.Y;
	a.Z = this.Z;
};
CL3D.Vect3d.prototype.substract = function (a) {
	return new CL3D.Vect3d(this.X - a.X, this.Y - a.Y, this.Z - a.Z);
};
CL3D.Vect3d.prototype.substractFromThis = function (a) {
	this.X -= a.X;
	this.Y -= a.Y;
	this.Z -= a.Z;
};
CL3D.Vect3d.prototype.add = function (a) {
	return new CL3D.Vect3d(this.X + a.X, this.Y + a.Y, this.Z + a.Z);
};
CL3D.Vect3d.prototype.addToThis = function (a) {
	this.X += a.X;
	this.Y += a.Y;
	this.Z += a.Z;
};
CL3D.Vect3d.prototype.addToThisReturnMe = function (a) {
	this.X += a.X;
	this.Y += a.Y;
	this.Z += a.Z;
	return this;
};
CL3D.Vect3d.prototype.normalize = function () {
	var a = this.X * this.X + this.Y * this.Y + this.Z * this.Z;
	if (a > -1e-7 && a < 1e-7) {
		return;
	}
	a = 1 / Math.sqrt(a);
	this.X *= a;
	this.Y *= a;
	this.Z *= a;
};
CL3D.Vect3d.prototype.getNormalized = function () {
	var a = this.X * this.X + this.Y * this.Y + this.Z * this.Z;
	if (a > -1e-7 && a < 1e-7) {
		return new CL3D.Vect3d(0, 0, 0);
	}
	a = 1 / Math.sqrt(a);
	return new CL3D.Vect3d(this.X * a, this.Y * a, this.Z * a);
};
CL3D.Vect3d.prototype.setLength = function (b) {
	var a = this.X * this.X + this.Y * this.Y + this.Z * this.Z;
	if (a > -1e-7 && a < 1e-7) {
		return;
	}
	a = b / Math.sqrt(a);
	this.X *= a;
	this.Y *= a;
	this.Z *= a;
};
CL3D.Vect3d.prototype.setTo = function (a) {
	this.X = a.X;
	this.Y = a.Y;
	this.Z = a.Z;
};
CL3D.Vect3d.prototype.equals = function (a) {
	return CL3D.equals(this.X, a.X) && CL3D.equals(this.Y, a.Y) && CL3D.equals(this.Z, a.Z);
};
CL3D.Vect3d.prototype.equalsZero = function () {
	return CL3D.iszero(this.X) && CL3D.iszero(this.Y) && CL3D.iszero(this.Z);
};
CL3D.Vect3d.prototype.equalsByNumbers = function (a, c, b) {
	return CL3D.equals(this.X, a) && CL3D.equals(this.Y, c) && CL3D.equals(this.Z, b);
};
CL3D.Vect3d.prototype.isZero = function () {
	return this.X == 0 && this.Y == 0 && this.Z == 0;
};
CL3D.Vect3d.prototype.getLength = function () {
	return Math.sqrt(this.X * this.X + this.Y * this.Y + this.Z * this.Z);
};
CL3D.Vect3d.prototype.getDistanceTo = function (b) {
	var a = b.X - this.X;
	var d = b.Y - this.Y;
	var c = b.Z - this.Z;
	return Math.sqrt(a * a + d * d + c * c);
};
CL3D.Vect3d.prototype.getDistanceFromSQ = function (b) {
	var a = b.X - this.X;
	var d = b.Y - this.Y;
	var c = b.Z - this.Z;
	return a * a + d * d + c * c;
};
CL3D.Vect3d.prototype.getLengthSQ = function () {
	return this.X * this.X + this.Y * this.Y + this.Z * this.Z;
};
CL3D.Vect3d.prototype.multiplyWithScal = function (a) {
	return new CL3D.Vect3d(this.X * a, this.Y * a, this.Z * a);
};
CL3D.Vect3d.prototype.multiplyThisWithScal = function (a) {
	this.X *= a;
	this.Y *= a;
	this.Z *= a;
};
CL3D.Vect3d.prototype.multiplyThisWithScalReturnMe = function (a) {
	this.X *= a;
	this.Y *= a;
	this.Z *= a;
	return this;
};
CL3D.Vect3d.prototype.multiplyThisWithVect = function (a) {
	this.X *= a.X;
	this.Y *= a.Y;
	this.Z *= a.Z;
};
CL3D.Vect3d.prototype.multiplyWithVect = function (a) {
	return new CL3D.Vect3d(this.X * a.X, this.Y * a.Y, this.Z * a.Z);
};
CL3D.Vect3d.prototype.divideThisThroughVect = function (a) {
	this.X /= a.X;
	this.Y /= a.Y;
	this.Z /= a.Z;
};
CL3D.Vect3d.prototype.divideThroughVect = function (a) {
	return new CL3D.Vect3d(this.X / a.X, this.Y / a.Y, this.Z / a.Z);
};
CL3D.Vect3d.prototype.crossProduct = function (a) {
	return new CL3D.Vect3d(this.Y * a.Z - this.Z * a.Y, this.Z * a.X - this.X * a.Z, this.X * a.Y - this.Y * a.X);
};
CL3D.Vect3d.prototype.dotProduct = function (a) {
	return this.X * a.X + this.Y * a.Y + this.Z * a.Z;
};
CL3D.Vect3d.prototype.getHorizontalAngle = function () {
	var b = new CL3D.Vect3d();
	b.Y = CL3D.radToDeg(Math.atan2(this.X, this.Z));
	if (b.Y < 0) {
		b.Y += 360;
	}
	if (b.Y >= 360) {
		b.Y -= 360;
	}
	var a = Math.sqrt(this.X * this.X + this.Z * this.Z);
	b.X = CL3D.radToDeg(Math.atan2(a, this.Y)) - 90;
	if (b.X < 0) {
		b.X += 360;
	}
	if (b.X >= 360) {
		b.X -= 360;
	}
	return b;
};
CL3D.Vect3d.prototype.toString = function () {
	return "(x: " + this.X + " y:" + this.Y + " z:" + this.Z + ")";
};
CL3D.Line3d = function () {
	this.Start = new CL3D.Vect3d();
	this.End = new CL3D.Vect3d();
};
CL3D.Line3d.prototype.Start = null;
CL3D.Line3d.prototype.End = null;
CL3D.Line3d.prototype.getVector = function () {
	return this.End.substract(this.Start);
};
CL3D.Line3d.prototype.getLength = function () {
	return this.getVector().getLength();
};
CL3D.Vect2d = function (a, b) {
	if (a == null) {
		this.X = 0;
		this.Y = 0;
	} else {
		this.X = a;
		this.Y = b;
	}
};
CL3D.Vect2d.prototype.X = 0;
CL3D.Vect2d.prototype.Y = 0;
CL3D.Box3d = function () {
	this.MinEdge = new CL3D.Vect3d();
	this.MaxEdge = new CL3D.Vect3d();
};
CL3D.Box3d.prototype.MinEdge = null;
CL3D.Box3d.prototype.MaxEdge = null;
CL3D.Box3d.prototype.clone = function () {
	var a = new CL3D.Box3d();
	a.MinEdge = this.MinEdge.clone();
	a.MaxEdge = this.MaxEdge.clone();
	return a;
};
CL3D.Box3d.prototype.getCenter = function () {
	var a = this.MinEdge.add(this.MaxEdge);
	a.multiplyThisWithScal(0.5);
	return a;
};
CL3D.Box3d.prototype.getExtent = function () {
	return this.MaxEdge.substract(this.MinEdge);
};
CL3D.Box3d.prototype.getEdges = function () {
	var b = this.getCenter();
	var c = b.substract(this.MaxEdge);
	var a = new Array();
	a.push(new CL3D.Vect3d(b.X + c.X, b.Y + c.Y, b.Z + c.Z));
	a.push(new CL3D.Vect3d(b.X + c.X, b.Y - c.Y, b.Z + c.Z));
	a.push(new CL3D.Vect3d(b.X + c.X, b.Y + c.Y, b.Z - c.Z));
	a.push(new CL3D.Vect3d(b.X + c.X, b.Y - c.Y, b.Z - c.Z));
	a.push(new CL3D.Vect3d(b.X - c.X, b.Y + c.Y, b.Z + c.Z));
	a.push(new CL3D.Vect3d(b.X - c.X, b.Y - c.Y, b.Z + c.Z));
	a.push(new CL3D.Vect3d(b.X - c.X, b.Y + c.Y, b.Z - c.Z));
	a.push(new CL3D.Vect3d(b.X - c.X, b.Y - c.Y, b.Z - c.Z));
	return a;
};
CL3D.Box3d.prototype.intersectsWithLine = function (d, e) {
	var c = e.substract(d);
	var a = c.getLength();
	c.normalize();
	var b = d.add(e).multiplyWithScal(0.5);
	return this.intersectsWithLineImpl(b, c, a * 0.5);
};
CL3D.Box3d.prototype.intersectsWithLineImpl = function (b, a, g) {
	var f = this.getExtent().multiplyWithScal(0.5);
	var c = this.getCenter().substract(b);
	if ((Math.abs(c.X) > f.X + g * Math.abs(a.X)) || (Math.abs(c.Y) > f.Y + g * Math.abs(a.Y)) || (Math.abs(c.Z) > f.Z + g * Math.abs(a.Z))) {
		return false;
	}
	var d = f.Y * Math.abs(a.Z) + f.Z * Math.abs(a.Y);
	if (Math.abs(c.Y * a.Z - c.Z * a.Y) > d) {
		return false;
	}
	d = f.X * Math.abs(a.Z) + f.Z * Math.abs(a.X);
	if (Math.abs(c.Z * a.X - c.X * a.Z) > d) {
		return false;
	}
	d = f.X * Math.abs(a.Y) + f.Y * Math.abs(a.X);
	if (Math.abs(c.X * a.Y - c.Y * a.X) > d) {
		return false;
	}
	return true;
};
CL3D.Box3d.prototype.addInternalPoint = function (a, c, b) {
	if (a > this.MaxEdge.X) {
		this.MaxEdge.X = a;
	}
	if (c > this.MaxEdge.Y) {
		this.MaxEdge.Y = c;
	}
	if (b > this.MaxEdge.Z) {
		this.MaxEdge.Z = b;
	}
	if (a < this.MinEdge.X) {
		this.MinEdge.X = a;
	}
	if (c < this.MinEdge.Y) {
		this.MinEdge.Y = c;
	}
	if (b < this.MinEdge.Z) {
		this.MinEdge.Z = b;
	}
};
CL3D.Box3d.prototype.addInternalPointByVector = function (a) {
	this.addInternalPoint(a.X, a.Y, a.Z);
};
CL3D.Box3d.prototype.intersectsWithBox = function (a) {
	return this.MinEdge.X <= a.MaxEdge.X && this.MinEdge.Y <= a.MaxEdge.Y && this.MinEdge.Z <= a.MaxEdge.Z && this.MaxEdge.X >= a.MinEdge.X && this.MaxEdge.Y >= a.MinEdge.Y && this.MaxEdge.Z >= a.MinEdge.Z;
};
CL3D.Box3d.prototype.isPointInside = function (a) {
	return a.X >= this.MinEdge.X && a.X <= this.MaxEdge.X && a.Y >= this.MinEdge.Y && a.Y <= this.MaxEdge.Y && a.Z >= this.MinEdge.Z && a.Z <= this.MaxEdge.Z;
};
CL3D.Plane3d = function () {
	this.Normal = new CL3D.Vect3d(0, 1, 0);
	this.recalculateD(new CL3D.Vect3d(0, 0, 0));
};
CL3D.Plane3d.prototype.D = 0;
CL3D.Plane3d.prototype.Normal = null;
CL3D.Plane3d.ISREL3D_FRONT = 0;
CL3D.Plane3d.ISREL3D_BACK = 1;
CL3D.Plane3d.ISREL3D_PLANAR = 2;
CL3D.Plane3d.prototype.clone = function () {
	var a = new CL3D.Plane3dF(false);
	a.Normal = this.Normal.clone();
	a.D = this.D;
	return a;
};
CL3D.Plane3d.prototype.recalculateD = function (a) {
	this.D = -a.dotProduct(this.Normal);
};
CL3D.Plane3d.prototype.getMemberPoint = function () {
	return this.Normal.multiplyWithScal(-this.D);
};
CL3D.Plane3d.prototype.setPlane = function (a, b) {
	this.Normal = b.clone();
	this.recalculateD(a);
};
CL3D.Plane3d.prototype.setPlaneFrom3Points = function (c, b, a) {
	this.Normal = (b.substract(c)).crossProduct(a.substract(c));
	this.Normal.normalize();
	this.recalculateD(c);
};
CL3D.Plane3d.prototype.normalize = function () {
	var a = (1 / this.Normal.getLength());
	this.Normal = this.Normal.multiplyWithScal(a);
	this.D *= a;
};
CL3D.Plane3d.prototype.classifyPointRelation = function (a) {
	var b = this.Normal.dotProduct(a) + this.D;
	if (b < -0.000001) {
		return CL3D.Plane3d.ISREL3D_BACK;
	}
	if (b > 0.000001) {
		return CL3D.Plane3d.ISREL3D_FRONT;
	}
	return CL3D.Plane3d.ISREL3D_PLANAR;
};
CL3D.Plane3d.prototype.getIntersectionWithPlanes = function (d, c, b) {
	var a = new CL3D.Vect3d();
	var e = new CL3D.Vect3d();
	if (this.getIntersectionWithPlane(d, a, e)) {
		return c.getIntersectionWithLine(a, e, b);
	}
	return false;
};
CL3D.Plane3d.prototype.getIntersectionWithPlane = function (k, m, g) {
	var f = this.Normal.getLength();
	var e = this.Normal.dotProduct(k.Normal);
	var a = k.Normal.getLength();
	var h = f * a - e * e;
	if (Math.abs(h) < 1e-8) {
		return false;
	}
	var d = 1 / h;
	var l = (a * -this.D + e * k.D) * d;
	var j = (f * -k.D + e * this.D) * d;
	this.Normal.crossProduct(k.Normal).copyTo(g);
	var c = this.Normal.multiplyWithScal(l);
	var b = k.Normal.multiplyWithScal(j);
	c.add(b).copyTo(m);
	return true;
};
CL3D.Plane3d.prototype.getIntersectionWithLine = function (d, e, c) {
	var b = this.Normal.dotProduct(e);
	if (b == 0) {
		return false;
	}
	var a = -(this.Normal.dotProduct(d) + this.D) / b;
	d.add((e.multiplyWithScal(a))).copyTo(c);
	return true;
};
CL3D.Plane3d.prototype.getDistanceTo = function (a) {
	return a.dotProduct(this.Normal) + this.D;
};
CL3D.Plane3d.prototype.isFrontFacing = function (b) {
	var a = this.Normal.dotProduct(b);
	return a <= 0;
};
CL3D.Triangle3d = function (e, d, f) {
	if (e) {
		this.pointA = e;
	} else {
		this.pointA = new CL3D.Vect3d();
	}
	if (d) {
		this.pointB = d;
	} else {
		this.pointB = new CL3D.Vect3d();
	}
	if (f) {
		this.pointC = f;
	} else {
		this.pointC = new CL3D.Vect3d();
	}
};
CL3D.Triangle3d.prototype.pointA = null;
CL3D.Triangle3d.prototype.pointB = null;
CL3D.Triangle3d.prototype.pointC = null;
CL3D.Triangle3d.prototype.clone = function () {
	return new CL3D.Triangle3d(this.pointA, this.pointB, this.pointC);
};
CL3D.Triangle3d.prototype.getPlane = function () {
	var a = new CL3D.Plane3d(false);
	a.setPlaneFrom3Points(this.pointA, this.pointB, this.pointC);
	return a;
};
CL3D.Triangle3d.prototype.isPointInsideFast = function (k) {
	var m = this.pointB.substract(this.pointA);
	var l = this.pointC.substract(this.pointA);
	var v = m.dotProduct(m);
	var t = m.dotProduct(l);
	var r = l.dotProduct(l);
	var j = k.substract(this.pointA);
	var o = j.dotProduct(m);
	var n = j.dotProduct(l);
	var u = (o * r) - (n * t);
	var s = (n * v) - (o * t);
	var h = (v * r) - (t * t);
	var q = u + s - h;
	return (q < 0) && !((u < 0) || (s < 0));
};
CL3D.Triangle3d.prototype.isPointInside = function (a) {
	return (this.isOnSameSide(a, this.pointA, this.pointB, this.pointC) && this.isOnSameSide(a, this.pointB, this.pointA, this.pointC) && this.isOnSameSide(a, this.pointC, this.pointA, this.pointB));
};
CL3D.Triangle3d.prototype.isOnSameSide = function (j, g, d, c) {
	var e = c.substract(d);
	var h = e.crossProduct(j.substract(d));
	var f = e.crossProduct(g.substract(d));
	return (h.dotProduct(f) >= 0);
};
CL3D.Triangle3d.prototype.getNormal = function () {
	return this.pointB.substract(this.pointA).crossProduct(this.pointC.substract(this.pointA));
};
CL3D.Triangle3d.prototype.getIntersectionOfPlaneWithLine = function (c, f) {
	var e = this.getNormal();
	e.normalize();
	var b = e.dotProduct(f);
	if (CL3D.iszero(b)) {
		return null;
	}
	var g = this.pointA.dotProduct(e);
	var a = -(e.dotProduct(c) - g) / b;
	return c.add(f.multiplyWithScal(a));
};
CL3D.Triangle3d.prototype.getIntersectionWithLine = function (b, c) {
	var a = this.getIntersectionOfPlaneWithLine(b, c);
	if (a == null) {
		return null;
	}
	if (this.isPointInside(a)) {
		return a;
	}
	return null;
};
CL3D.Triangle3d.prototype.isTotalInsideBox = function (a) {
	return a.isPointInside(this.pointA) && a.isPointInside(this.pointB) && a.isPointInside(this.pointC);
};
CL3D.Triangle3d.prototype.copyTo = function (a) {
	this.pointA.copyTo(a.pointA);
	this.pointB.copyTo(a.pointB);
	this.pointC.copyTo(a.pointC);
};
CL3D.Matrix4 = function (a) {
	if (a == null) {
		a = true;
	}
	this.m00 = 0;
	this.m01 = 0;
	this.m02 = 0;
	this.m03 = 0;
	this.m04 = 0;
	this.m05 = 0;
	this.m06 = 0;
	this.m07 = 0;
	this.m08 = 0;
	this.m09 = 0;
	this.m10 = 0;
	this.m11 = 0;
	this.m12 = 0;
	this.m13 = 0;
	this.m14 = 0;
	this.m15 = 0;
	this.bIsIdentity = false;
	if (a) {
		this.m00 = 1;
		this.m05 = 1;
		this.m10 = 1;
		this.m15 = 1;
		this.bIsIdentity = true;
	}
};
CL3D.Matrix4.prototype.makeIdentity = function () {
	this.m00 = 1;
	this.m01 = 0;
	this.m02 = 0;
	this.m03 = 0;
	this.m04 = 0;
	this.m05 = 1;
	this.m06 = 0;
	this.m07 = 0;
	this.m08 = 0;
	this.m09 = 0;
	this.m10 = 1;
	this.m11 = 0;
	this.m12 = 0;
	this.m13 = 0;
	this.m14 = 0;
	this.m15 = 1;
	this.bIsIdentity = true;
};
CL3D.Matrix4.prototype.isIdentity = function () {
	if (this.bIsIdentity) {
		return true;
	}
	this.bIsIdentity = (CL3D.isone(this.m00) && CL3D.iszero(this.m01) && CL3D.iszero(this.m02) && CL3D.iszero(this.m03) && CL3D.iszero(this.m04) && CL3D.isone(this.m05) && CL3D.iszero(this.m06) && CL3D.iszero(this.m07) && CL3D.iszero(this.m08) && CL3D.iszero(this.m09) && CL3D.isone(this.m10) && CL3D.iszero(this.m11) && CL3D.iszero(this.m12) && CL3D.iszero(this.m13) && CL3D.iszero(this.m14) && CL3D.isone(this.m15));
	return this.bIsIdentity;
};
CL3D.Matrix4.prototype.isTranslateOnly = function () {
	if (this.bIsIdentity) {
		return true;
	}
	return (CL3D.isone(this.m00) && CL3D.iszero(this.m01) && CL3D.iszero(this.m02) && CL3D.iszero(this.m03) && CL3D.iszero(this.m04) && CL3D.isone(this.m05) && CL3D.iszero(this.m06) && CL3D.iszero(this.m07) && CL3D.iszero(this.m08) && CL3D.iszero(this.m09) && CL3D.isone(this.m10) && CL3D.iszero(this.m11) && CL3D.isone(this.m15));
};
CL3D.Matrix4.prototype.equals = function (a) {
	return CL3D.equals(this.m00, a.m00) && CL3D.equals(this.m01, a.m01) && CL3D.equals(this.m02, a.m02) && CL3D.equals(this.m03, a.m03) && CL3D.equals(this.m04, a.m04) && CL3D.equals(this.m05, a.m05) && CL3D.equals(this.m06, a.m06) && CL3D.equals(this.m07, a.m07) && CL3D.equals(this.m08, a.m08) && CL3D.equals(this.m09, a.m09) && CL3D.equals(this.m10, a.m10) && CL3D.equals(this.m11, a.m11) && CL3D.equals(this.m12, a.m12) && CL3D.equals(this.m13, a.m13) && CL3D.equals(this.m14, a.m14) && CL3D.equals(this.m15, a.m15);
};
CL3D.Matrix4.prototype.getTranslation = function () {
	return new CL3D.Vect3d(this.m12, this.m13, this.m14);
};
CL3D.Matrix4.prototype.getScale = function () {
	return new CL3D.Vect3d(this.m00, this.m05, this.m10);
};
CL3D.Matrix4.prototype.rotateVect = function (a) {
	var b = a.clone();
	a.X = b.X * this.m00 + b.Y * this.m04 + b.Z * this.m08;
	a.Y = b.X * this.m01 + b.Y * this.m05 + b.Z * this.m09;
	a.Z = b.X * this.m02 + b.Y * this.m06 + b.Z * this.m10;
};
CL3D.Matrix4.prototype.rotateVect2 = function (a, b) {
	a.X = b.X * this.m00 + b.Y * this.m04 + b.Z * this.m08;
	a.Y = b.X * this.m01 + b.Y * this.m05 + b.Z * this.m09;
	a.Z = b.X * this.m02 + b.Y * this.m06 + b.Z * this.m10;
};
CL3D.Matrix4.prototype.getRotatedVect = function (a) {
	return new CL3D.Vect3d(a.X * this.m00 + a.Y * this.m04 + a.Z * this.m08, a.X * this.m01 + a.Y * this.m05 + a.Z * this.m09, a.X * this.m02 + a.Y * this.m06 + a.Z * this.m10);
};
CL3D.Matrix4.prototype.getTransformedVect = function (a) {
	return new CL3D.Vect3d(a.X * this.m00 + a.Y * this.m04 + a.Z * this.m08 + this.m12, a.X * this.m01 + a.Y * this.m05 + a.Z * this.m09 + this.m13, a.X * this.m02 + a.Y * this.m06 + a.Z * this.m10 + this.m14);
};
CL3D.Matrix4.prototype.transformVect = function (c) {
	var b = c.X * this.m00 + c.Y * this.m04 + c.Z * this.m08 + this.m12;
	var a = c.X * this.m01 + c.Y * this.m05 + c.Z * this.m09 + this.m13;
	var d = c.X * this.m02 + c.Y * this.m06 + c.Z * this.m10 + this.m14;
	c.X = b;
	c.Y = a;
	c.Z = d;
};
CL3D.Matrix4.prototype.transformVect2 = function (a, b) {
	a.X = b.X * this.m00 + b.Y * this.m04 + b.Z * this.m08 + this.m12;
	a.Y = b.X * this.m01 + b.Y * this.m05 + b.Z * this.m09 + this.m13;
	a.Z = b.X * this.m02 + b.Y * this.m06 + b.Z * this.m10 + this.m14;
};
CL3D.Matrix4.prototype.getTranslatedVect = function (a) {
	return new CL3D.Vect3d(a.X + this.m12, a.Y + this.m13, a.Z + this.m14);
};
CL3D.Matrix4.prototype.translateVect = function (a) {
	a.X = a.X + this.m12;
	a.Y = a.Y + this.m13;
	a.Z = a.Z + this.m14;
};
CL3D.Matrix4.prototype.transformPlane = function (a) {
	var d = a.getMemberPoint();
	this.transformVect(d);
	var b = a.Normal.clone();
	b.normalize();
	var c = this.getScale();
	if (!CL3D.equals(c.X, 0) && !CL3D.equals(c.Y, 0) && !CL3D.equals(c.Z, 0) && (!CL3D.equals(c.X, 1) || !CL3D.equals(c.Y, 1) || !CL3D.equals(c.Z, 1))) {
		b.X *= 1 / (c.X * c.X);
		b.Y *= 1 / (c.Y * c.Y);
		b.Z *= 1 / (c.Z * c.Z);
	}
	rotateVect(b);
	b.normalize();
	a.setPlane(d, b);
};
CL3D.Matrix4.prototype.multiply = function (a) {
	var b = new CL3D.Matrix4(false);
	if (this.bIsIdentity) {
		a.copyTo(b);
		return b;
	}
	if (a.bIsIdentity) {
		this.copyTo(b);
		return b;
	}
	b.m00 = this.m00 * a.m00 + this.m04 * a.m01 + this.m08 * a.m02 + this.m12 * a.m03;
	b.m01 = this.m01 * a.m00 + this.m05 * a.m01 + this.m09 * a.m02 + this.m13 * a.m03;
	b.m02 = this.m02 * a.m00 + this.m06 * a.m01 + this.m10 * a.m02 + this.m14 * a.m03;
	b.m03 = this.m03 * a.m00 + this.m07 * a.m01 + this.m11 * a.m02 + this.m15 * a.m03;
	b.m04 = this.m00 * a.m04 + this.m04 * a.m05 + this.m08 * a.m06 + this.m12 * a.m07;
	b.m05 = this.m01 * a.m04 + this.m05 * a.m05 + this.m09 * a.m06 + this.m13 * a.m07;
	b.m06 = this.m02 * a.m04 + this.m06 * a.m05 + this.m10 * a.m06 + this.m14 * a.m07;
	b.m07 = this.m03 * a.m04 + this.m07 * a.m05 + this.m11 * a.m06 + this.m15 * a.m07;
	b.m08 = this.m00 * a.m08 + this.m04 * a.m09 + this.m08 * a.m10 + this.m12 * a.m11;
	b.m09 = this.m01 * a.m08 + this.m05 * a.m09 + this.m09 * a.m10 + this.m13 * a.m11;
	b.m10 = this.m02 * a.m08 + this.m06 * a.m09 + this.m10 * a.m10 + this.m14 * a.m11;
	b.m11 = this.m03 * a.m08 + this.m07 * a.m09 + this.m11 * a.m10 + this.m15 * a.m11;
	b.m12 = this.m00 * a.m12 + this.m04 * a.m13 + this.m08 * a.m14 + this.m12 * a.m15;
	b.m13 = this.m01 * a.m12 + this.m05 * a.m13 + this.m09 * a.m14 + this.m13 * a.m15;
	b.m14 = this.m02 * a.m12 + this.m06 * a.m13 + this.m10 * a.m14 + this.m14 * a.m15;
	b.m15 = this.m03 * a.m12 + this.m07 * a.m13 + this.m11 * a.m14 + this.m15 * a.m15;
	return b;
};
CL3D.Matrix4.prototype.multiplyWith1x4Matrix = function (a) {
	var b = a.clone();
	b.W = a.W;
	a.X = b.X * this.m00 + b.Y * this.m04 + b.Z * this.m08 + b.W * this.m12;
	a.Y = b.X * this.m01 + b.Y * this.m05 + b.Z * this.m09 + b.W * this.m13;
	a.Z = b.X * this.m02 + b.Y * this.m06 + b.Z * this.m10 + b.W * this.m14;
	a.W = b.X * this.m03 + b.Y * this.m07 + b.Z * this.m11 + b.W * this.m15;
};
CL3D.Matrix4.prototype.getInverse = function (a) {
	if (this.bIsIdentity) {
		this.copyTo(a);
		return true;
	}
	var b = (this.m00 * this.m05 - this.m01 * this.m04) * (this.m10 * this.m15 - this.m11 * this.m14) - (this.m00 * this.m06 - this.m02 * this.m04) * (this.m09 * this.m15 - this.m11 * this.m13) + (this.m00 * this.m07 - this.m03 * this.m04) * (this.m09 * this.m14 - this.m10 * this.m13) + (this.m01 * this.m06 - this.m02 * this.m05) * (this.m08 * this.m15 - this.m11 * this.m12) - (this.m01 * this.m07 - this.m03 * this.m05) * (this.m08 * this.m14 - this.m10 * this.m12) + (this.m02 * this.m07 - this.m03 * this.m06) * (this.m08 * this.m13 - this.m09 * this.m12);
	if (b > -1e-7 && b < 1e-7) {
		return false;
	}
	b = 1 / b;
	a.m00 = b * (this.m05 * (this.m10 * this.m15 - this.m11 * this.m14) + this.m06 * (this.m11 * this.m13 - this.m09 * this.m15) + this.m07 * (this.m09 * this.m14 - this.m10 * this.m13));
	a.m01 = b * (this.m09 * (this.m02 * this.m15 - this.m03 * this.m14) + this.m10 * (this.m03 * this.m13 - this.m01 * this.m15) + this.m11 * (this.m01 * this.m14 - this.m02 * this.m13));
	a.m02 = b * (this.m13 * (this.m02 * this.m07 - this.m03 * this.m06) + this.m14 * (this.m03 * this.m05 - this.m01 * this.m07) + this.m15 * (this.m01 * this.m06 - this.m02 * this.m05));
	a.m03 = b * (this.m01 * (this.m07 * this.m10 - this.m06 * this.m11) + this.m02 * (this.m05 * this.m11 - this.m07 * this.m09) + this.m03 * (this.m06 * this.m09 - this.m05 * this.m10));
	a.m04 = b * (this.m06 * (this.m08 * this.m15 - this.m11 * this.m12) + this.m07 * (this.m10 * this.m12 - this.m08 * this.m14) + this.m04 * (this.m11 * this.m14 - this.m10 * this.m15));
	a.m05 = b * (this.m10 * (this.m00 * this.m15 - this.m03 * this.m12) + this.m11 * (this.m02 * this.m12 - this.m00 * this.m14) + this.m08 * (this.m03 * this.m14 - this.m02 * this.m15));
	a.m06 = b * (this.m14 * (this.m00 * this.m07 - this.m03 * this.m04) + this.m15 * (this.m02 * this.m04 - this.m00 * this.m06) + this.m12 * (this.m03 * this.m06 - this.m02 * this.m07));
	a.m07 = b * (this.m02 * (this.m07 * this.m08 - this.m04 * this.m11) + this.m03 * (this.m04 * this.m10 - this.m06 * this.m08) + this.m00 * (this.m06 * this.m11 - this.m07 * this.m10));
	a.m08 = b * (this.m07 * (this.m08 * this.m13 - this.m09 * this.m12) + this.m04 * (this.m09 * this.m15 - this.m11 * this.m13) + this.m05 * (this.m11 * this.m12 - this.m08 * this.m15));
	a.m09 = b * (this.m11 * (this.m00 * this.m13 - this.m01 * this.m12) + this.m08 * (this.m01 * this.m15 - this.m03 * this.m13) + this.m09 * (this.m03 * this.m12 - this.m00 * this.m15));
	a.m10 = b * (this.m15 * (this.m00 * this.m05 - this.m01 * this.m04) + this.m12 * (this.m01 * this.m07 - this.m03 * this.m05) + this.m13 * (this.m03 * this.m04 - this.m00 * this.m07));
	a.m11 = b * (this.m03 * (this.m05 * this.m08 - this.m04 * this.m09) + this.m00 * (this.m07 * this.m09 - this.m05 * this.m11) + this.m01 * (this.m04 * this.m11 - this.m07 * this.m08));
	a.m12 = b * (this.m04 * (this.m10 * this.m13 - this.m09 * this.m14) + this.m05 * (this.m08 * this.m14 - this.m10 * this.m12) + this.m06 * (this.m09 * this.m12 - this.m08 * this.m13));
	a.m13 = b * (this.m08 * (this.m02 * this.m13 - this.m01 * this.m14) + this.m09 * (this.m00 * this.m14 - this.m02 * this.m12) + this.m10 * (this.m01 * this.m12 - this.m00 * this.m13));
	a.m14 = b * (this.m12 * (this.m02 * this.m05 - this.m01 * this.m06) + this.m13 * (this.m00 * this.m06 - this.m02 * this.m04) + this.m14 * (this.m01 * this.m04 - this.m00 * this.m05));
	a.m15 = b * (this.m00 * (this.m05 * this.m10 - this.m06 * this.m09) + this.m01 * (this.m06 * this.m08 - this.m04 * this.m10) + this.m02 * (this.m04 * this.m09 - this.m05 * this.m08));
	a.bIsIdentity = this.bIsIdentity;
	return true;
};
CL3D.Matrix4.prototype.makeInverse = function () {
	var a = new CL3D.Matrix4(false);
	if (this.getInverse(a)) {
		a.copyTo(this);
		return true;
	}
	return false;
};
CL3D.Matrix4.prototype.getTranspose = function (m) {
	m.m00 = this.m00; m.m01 = this.m04; m.m02 = this.m08; m.m03 = this.m12;
	m.m04 = this.m01; m.m05 = this.m05; m.m06 = this.m09; m.m07 = this.m13;
	m.m08 = this.m02; m.m09 = this.m06; m.m10 = this.m10; m.m11 = this.m14;
	m.m12 = this.m03; m.m13 = this.m07; m.m14 = this.m11; m.m15 = this.m15;
};
CL3D.Matrix4.prototype.makeTranspose = function () {
	var a = new CL3D.Matrix4(false);
	this.getTranspose(a);
	a.copyTo(this);
};
CL3D.Matrix4.prototype.getTransposed = function () {
	var a = new CL3D.Matrix4(false);
	a.m00 = this.m00;
	a.m01 = this.m04;
	a.m02 = this.m08;
	a.m03 = this.m12;
	a.m04 = this.m01;
	a.m05 = this.m05;
	a.m06 = this.m09;
	a.m07 = this.m13;
	a.m08 = this.m02;
	a.m09 = this.m06;
	a.m10 = this.m10;
	a.m11 = this.m14;
	a.m12 = this.m03;
	a.m13 = this.m07;
	a.m14 = this.m11;
	a.m15 = this.m15;
	a.bIsIdentity = this.bIsIdentity;
	return a;
};
CL3D.Matrix4.prototype.asArray = function () {
	return [this.m00, this.m01, this.m02, this.m03, this.m04, this.m05, this.m06, this.m07, this.m08, this.m09, this.m10, this.m11, this.m12, this.m13, this.m14, this.m15];
};
CL3D.Matrix4.prototype.setByIndex = function (a, b) {
	this.bIsIdentity = false;
	switch (a) {
	case 0:
		this.m00 = b;
		break;
	case 1:
		this.m01 = b;
		break;
	case 2:
		this.m02 = b;
		break;
	case 3:
		this.m03 = b;
		break;
	case 4:
		this.m04 = b;
		break;
	case 5:
		this.m05 = b;
		break;
	case 6:
		this.m06 = b;
		break;
	case 7:
		this.m07 = b;
		break;
	case 8:
		this.m08 = b;
		break;
	case 9:
		this.m09 = b;
		break;
	case 10:
		this.m10 = b;
		break;
	case 11:
		this.m11 = b;
		break;
	case 12:
		this.m12 = b;
		break;
	case 13:
		this.m13 = b;
		break;
	case 14:
		this.m14 = b;
		break;
	case 15:
		this.m15 = b;
		break;
	}
};
CL3D.Matrix4.prototype.clone = function () {
	var a = new CL3D.Matrix4(false);
	this.copyTo(a);
	return a;
};
CL3D.Matrix4.prototype.copyTo = function (a) {
	a.m00 = this.m00;
	a.m01 = this.m01;
	a.m02 = this.m02;
	a.m03 = this.m03;
	a.m04 = this.m04;
	a.m05 = this.m05;
	a.m06 = this.m06;
	a.m07 = this.m07;
	a.m08 = this.m08;
	a.m09 = this.m09;
	a.m10 = this.m10;
	a.m11 = this.m11;
	a.m12 = this.m12;
	a.m13 = this.m13;
	a.m14 = this.m14;
	a.m15 = this.m15;
	a.bIsIdentity = this.bIsIdentity;
};
CL3D.Matrix4.prototype.buildProjectionMatrixPerspectiveFovLH = function (e, d, f, c) {
	var b = 1 / Math.tan(e / 2);
	var a = (b / d);
	this.m00 = a;
	this.m01 = 0;
	this.m02 = 0;
	this.m03 = 0;
	this.m04 = 0;
	this.m05 = b;
	this.m06 = 0;
	this.m07 = 0;
	this.m08 = 0;
	this.m09 = 0;
	this.m10 = (c / (c - f));
	this.m11 = 1;
	this.m12 = 0;
	this.m13 = 0;
	this.m14 = (-f * c / (c - f));
	this.m15 = 0;
	this.bIsIdentity = false;
};
CL3D.Matrix4.prototype.buildCameraLookAtMatrixLH = function (b, e, d) {
	var a = e.substract(b);
	a.normalize();
	var f = d.crossProduct(a);
	f.normalize();
	var c = a.crossProduct(f);
	this.m00 = f.X;
	this.m01 = c.X;
	this.m02 = a.X;
	this.m03 = 0;
	this.m04 = f.Y;
	this.m05 = c.Y;
	this.m06 = a.Y;
	this.m07 = 0;
	this.m08 = f.Z;
	this.m09 = c.Z;
	this.m10 = a.Z;
	this.m11 = 0;
	this.m12 = -f.dotProduct(b);
	this.m13 = -c.dotProduct(b);
	this.m14 = -a.dotProduct(b);
	this.m15 = 1;
	this.bIsIdentity = false;
};
CL3D.Matrix4.prototype.setRotationDegrees = function (a) {
	this.setRotationRadians(a.multiplyWithScal(CL3D.DEGTORAD));
};
CL3D.Matrix4.prototype.setRotationRadians = function (j) {
	var e = Math.cos(j.X);
	var a = Math.sin(j.X);
	var f = Math.cos(j.Y);
	var c = Math.sin(j.Y);
	var d = Math.cos(j.Z);
	var g = Math.sin(j.Z);
	this.m00 = (f * d);
	this.m01 = (f * g);
	this.m02 = (-c);
	var h = a * c;
	var b = e * c;
	this.m04 = (h * d - e * g);
	this.m05 = (h * g + e * d);
	this.m06 = (a * f);
	this.m08 = (b * d + a * g);
	this.m09 = (b * g - a * d);
	this.m10 = (e * f);
	this.bIsIdentity = false;
};
CL3D.Matrix4.prototype.getRotationDegrees = function () {
	var f = -Math.asin(this.m02);
	var e = Math.cos(f);
	f *= CL3D.RADTODEG;
	var c;
	var a;
	var g;
	var d;
	if (Math.abs(e) > 1e-8) {
		var b = (1 / e);
		c = this.m10 * b;
		a = this.m06 * b;
		g = Math.atan2(a, c) * CL3D.RADTODEG;
		c = this.m00 * b;
		a = this.m01 * b;
		d = Math.atan2(a, c) * CL3D.RADTODEG;
	} else {
		g = 0;
		c = this.m05;
		a = -this.m04;
		d = Math.atan2(a, c) * CL3D.RADTODEG;
	}
	if (g < 0) {
		g += 360;
	}
	if (f < 0) {
		f += 360;
	}
	if (d < 0) {
		d += 360;
	}
	return new CL3D.Vect3d(g, f, d);
};
CL3D.Matrix4.prototype.setTranslation = function (a) {
	this.m12 = a.X;
	this.m13 = a.Y;
	this.m14 = a.Z;
	this.bIsIdentity = false;
};
CL3D.Matrix4.prototype.setScale = function (a) {
	this.m00 = a.X;
	this.m05 = a.Y;
	this.m10 = a.Z;
	this.bIsIdentity = false;
};
CL3D.Matrix4.prototype.setScaleXYZ = function (a, c, b) {
	this.m00 = a;
	this.m05 = c;
	this.m10 = b;
	this.bIsIdentity = false;
};
CL3D.Matrix4.prototype.transformBoxEx = function (d) {
	var b = d.getEdges();
	var c;
	for (c = 0; c < 8; ++c) {
		this.transformVect(b[c]);
	}
	var a = b[0];
	d.MinEdge = a.clone();
	d.MaxEdge = a.clone();
	for (c = 1; c < 8; ++c) {
		d.addInternalPointByVector(b[c]);
	}
};
CL3D.Quaternion = function (a, d, c, b) {
	this.X = 0;
	this.Y = 0;
	this.Z = 0;
	this.W = 1;
	if (a != null) {
		this.X = a;
	}
	if (d != null) {
		this.Y = d;
	}
	if (c != null) {
		this.Z = c;
	}
	if (b != null) {
		this.W = b;
	}
};
CL3D.Quaternion.prototype.X = 0;
CL3D.Quaternion.prototype.Y = 0;
CL3D.Quaternion.prototype.Z = 0;
CL3D.Quaternion.prototype.W = 0;
CL3D.Quaternion.prototype.clone = function () {
	var a = new CL3D.Quaternion();
	this.copyTo(a);
	return a;
};
CL3D.Quaternion.prototype.copyTo = function (a) {
	a.X = this.X;
	a.Y = this.Y;
	a.Z = this.Z;
	a.W = this.W;
};
CL3D.Quaternion.prototype.multiplyWith = function (a) {
	return new CL3D.Quaternion(this.X * a, this.Y * a, this.Z * a, this.W * a);
};
CL3D.Quaternion.prototype.multiplyThisWith = function (a) {
	this.X = this.X * a;
	this.Y = this.Y * a;
	this.Z = this.Z * a;
	this.W = this.W * a;
};
CL3D.Quaternion.prototype.addToThis = function (a) {
	this.X += a.X;
	this.Y += a.Y;
	this.Z += a.Z;
	this.W += a.W;
	return this;
};
CL3D.Quaternion.prototype.slerp = function (g, f, b) {
	var c = g.dotProduct(f);
	if (c < 0) {
		g = g.multiplyWith(-1);
		c *= -1;
	}
	var d;
	var e;
	if ((c + 1) > 0.05) {
		if ((1 - c) >= 0.05) {
			var a = Math.acos(c);
			var j = 1 / Math.sin(a);
			d = Math.sin(a * (1 - b)) * j;
			e = Math.sin(a * b) * j;
		} else {
			d = 1 - b;
			e = b;
		}
	} else {
		f = new CL3D.Quaternion(-g.Y, g.X, -g.W, g.Z);
		d = Math.sin(CL3D.PI * (0.5 - b));
		e = Math.sin(CL3D.PI * b);
	}
	var h = g.multiplyWith(d).addToThis(f.multiplyWith(e));
	this.X = h.X;
	this.Y = h.Y;
	this.Z = h.Z;
	this.W = h.W;
};
CL3D.Quaternion.prototype.dotProduct = function (a) {
	return (this.X * a.X) + (this.Y * a.Y) + (this.Z * a.Z) + (this.W * a.W);
};
CL3D.Quaternion.prototype.getMatrix = function () {
	var a = new CL3D.Matrix4(false);
	this.getMatrix_transposed(a);
	return a;
};
CL3D.Quaternion.prototype.getMatrix_transposed = function (b) {
	var e = this.X;
	var d = this.Y;
	var c = this.Z;
	var a = this.W;
	b.m00 = 1 - 2 * d * d - 2 * c * c;
	b.m04 = 2 * e * d + 2 * c * a;
	b.m08 = 2 * e * c - 2 * d * a;
	b.m12 = 0;
	b.m01 = 2 * e * d - 2 * c * a;
	b.m05 = 1 - 2 * e * e - 2 * c * c;
	b.m09 = 2 * c * d + 2 * e * a;
	b.m13 = 0;
	b.m02 = 2 * e * c + 2 * d * a;
	b.m06 = 2 * c * d - 2 * e * a;
	b.m10 = 1 - 2 * e * e - 2 * d * d;
	b.m14 = 0;
	b.m03 = 0;
	b.m07 = 0;
	b.m11 = 0;
	b.m15 = 1;
	b.bIsIdentity = false;
};
CL3D.Quaternion.prototype.toEuler = function (a) {
	var e = this.W * this.W;
	var d = this.X * this.X;
	var c = this.Y * this.Y;
	var b = this.Z * this.Z;
	a.Z = (Math.atan2(2 * (this.X * this.Y + this.Z * this.W), (d - c - b + e)));
	a.X = (Math.atan2(2 * (this.Y * this.Z + this.X * this.W), (-d - c + b + e)));
	a.Y = Math.asin(CL3D.clamp(-2 * (this.X * this.Z - this.Y * this.W), -1, 1));
};
CL3D.Quaternion.prototype.setFromEuler = function (n, m, j) {
	var f = n * 0.5;
	var a = Math.sin(f);
	var g = Math.cos(f);
	f = m * 0.5;
	var c = Math.sin(f);
	var k = Math.cos(f);
	f = j * 0.5;
	var l = Math.sin(f);
	var e = Math.cos(f);
	var o = k * e;
	var h = c * e;
	var d = k * l;
	var b = c * l;
	this.X = (a * o - g * b);
	this.Y = (g * h + a * d);
	this.Z = (g * d - a * h);
	this.W = (g * o + a * b);
	this.normalize();
};
CL3D.Quaternion.prototype.normalize = function () {
	var a = this.X * this.X + this.Y * this.Y + this.Z * this.Z + this.W * this.W;
	if (a == 1) {
		return;
	}
	a = 1 / Math.sqrt(a);
	this.multiplyThisWith(a);
};
CL3D.Quaternion.prototype.toString = function () {
	return "(x: " + X + " y:" + Y + " z:" + Z + " w:" + W + ")";
};
CL3D.ViewFrustrum = function () {
	this.planes = new Array();
	for (var a = 0; a < CL3D.ViewFrustrum.VF_PLANE_COUNT; ++a) {
		this.planes.push(new CL3D.Plane3d());
	}
};
CL3D.ViewFrustrum.prototype.planes = null;
CL3D.ViewFrustrum.VF_FAR_PLANE = 0;
CL3D.ViewFrustrum.VF_NEAR_PLANE = 1;
CL3D.ViewFrustrum.VF_LEFT_PLANE = 2;
CL3D.ViewFrustrum.VF_RIGHT_PLANE = 3;
CL3D.ViewFrustrum.VF_BOTTOM_PLANE = 4;
CL3D.ViewFrustrum.VF_TOP_PLANE = 5;
CL3D.ViewFrustrum.VF_PLANE_COUNT = 6;
CL3D.ViewFrustrum.prototype.setFrom = function (d) {
	var b;
	b = this.planes[CL3D.ViewFrustrum.VF_LEFT_PLANE];
	b.Normal.X = d.m03 + d.m00;
	b.Normal.Y = d.m07 + d.m04;
	b.Normal.Z = d.m11 + d.m08;
	b.D = d.m15 + d.m12;
	b = this.planes[CL3D.ViewFrustrum.VF_RIGHT_PLANE];
	b.Normal.X = d.m03 - d.m00;
	b.Normal.Y = d.m07 - d.m04;
	b.Normal.Z = d.m11 - d.m08;
	b.D = d.m15 - d.m12;
	b = this.planes[CL3D.ViewFrustrum.VF_TOP_PLANE];
	b.Normal.X = d.m03 - d.m01;
	b.Normal.Y = d.m07 - d.m05;
	b.Normal.Z = d.m11 - d.m09;
	b.D = d.m15 - d.m13;
	b = this.planes[CL3D.ViewFrustrum.VF_BOTTOM_PLANE];
	b.Normal.X = d.m03 + d.m01;
	b.Normal.Y = d.m07 + d.m05;
	b.Normal.Z = d.m11 + d.m09;
	b.D = d.m15 + d.m13;
	b = this.planes[CL3D.ViewFrustrum.VF_FAR_PLANE];
	b.Normal.X = d.m03 - d.m02;
	b.Normal.Y = d.m07 - d.m06;
	b.Normal.Z = d.m11 - d.m10;
	b.D = d.m15 - d.m14;
	b = this.planes[CL3D.ViewFrustrum.VF_NEAR_PLANE];
	b.Normal.X = d.m02;
	b.Normal.Y = d.m06;
	b.Normal.Z = d.m10;
	b.D = d.m14;
	var c = 0;
	for (c = 0; c < CL3D.ViewFrustrum.VF_PLANE_COUNT; ++c) {
		b = this.planes[c];
		var a = -(1 / b.Normal.getLength());
		b.Normal = b.Normal.multiplyWithScal(a);
		b.D *= a;
	}
	this.recalculateBoundingBox();
};
CL3D.ViewFrustrum.prototype.getFarLeftUp = function () {
	var a = new CL3D.Vect3d();
	this.planes[CL3D.ViewFrustrum.VF_FAR_PLANE].getIntersectionWithPlanes(this.planes[CL3D.ViewFrustrum.VF_TOP_PLANE], this.planes[CL3D.ViewFrustrum.VF_LEFT_PLANE], a);
	return a;
};
CL3D.ViewFrustrum.prototype.getFarRightUp = function () {
	var a = new CL3D.Vect3d();
	this.planes[CL3D.ViewFrustrum.VF_FAR_PLANE].getIntersectionWithPlanes(this.planes[CL3D.ViewFrustrum.VF_TOP_PLANE], this.planes[CL3D.ViewFrustrum.VF_RIGHT_PLANE], a);
	return a;
};
CL3D.ViewFrustrum.prototype.getFarLeftDown = function () {
	var a = new CL3D.Vect3d();
	this.planes[CL3D.ViewFrustrum.VF_FAR_PLANE].getIntersectionWithPlanes(this.planes[CL3D.ViewFrustrum.VF_BOTTOM_PLANE], this.planes[CL3D.ViewFrustrum.VF_LEFT_PLANE], a);
	return a;
};
CL3D.ViewFrustrum.prototype.recalculateBoundingBox = function () {};
CL3D.Vertex3D = function (a) {
	if (a) {
		this.Pos = new CL3D.Vect3d();
		this.Normal = new CL3D.Vect3d();
		this.Color = 4294967295;
		this.TCoords = new CL3D.Vect2d();
		this.TCoords2 = new CL3D.Vect2d();
	}
};
CL3D.Vertex3D.prototype.Pos = null;
CL3D.Vertex3D.prototype.Normal = null;
CL3D.Vertex3D.prototype.Color = 0;
CL3D.Vertex3D.prototype.TCoords = null;
CL3D.Vertex3D.prototype.TCoords2 = null;
CL3D.Texture = function () {
	this.Name = "";
	this.Loaded = false;
	this.Image = null;
	this.Texture = null;
	this.CachedWidth = null;
	this.CachedHeight = null;
	this.OriginalWidth = null;
	this.OriginalHeight = null;
};
CL3D.Texture.prototype.getImage = function () {
	return this.Image;
};
CL3D.Texture.prototype.getWebGLTexture = function () {
	return this.Texture;
};
CL3D.Texture.prototype.getWidth = function () {
	if (this.Image) {
		return this.Image.width;
	}
	if (this.CachedWidth != null) {
		return this.CachedWidth;
	}
	return 0;
};
CL3D.Texture.prototype.getHeight = function () {
	if (this.Image) {
		return this.Image.height;
	}
	if (this.CachedHeight != null) {
		return this.CachedHeight;
	}
	return 0;
};
CL3D.Texture.prototype.getURL = function () {
	return this.Name;
};
CL3D.Texture.prototype.isLoaded = function () {
	return this.Loaded;
};
CL3D.Action = function () {};
CL3D.Action.prototype.execute = function (a, b) {};
CL3D.Action.SetOverlayText = function () {
	this.Text = "";
	this.SceneNodeToChange = null;
	this.ChangeCurrentSceneNode = false;
	this.Type = "SetOverlayText";
};
CL3D.Action.SetOverlayText.prototype.execute = function (a, h) {
	if (!a || !h) {
		return;
	}
	var k = null;
	if (this.ChangeCurrentSceneNode) {
		k = a;
	} else {
		if (this.SceneNodeToChange != -1) {
			k = h.getSceneNodeFromId(this.SceneNodeToChange);
		}
	}
	if (k && k.setText) {
		var g = this.Text.indexOf("$");
		if (g != -1) {
			var c = this.Text;
			var e = 0;
			var l = true;
			while (l) {
				l = false;
				g = c.indexOf("$", e);
				if (g != -1) {
					e = g + 1;
					var d = c.indexOf("$", g + 1);
					if (d != -1) {
						l = true;
						var b = c.substr(g + 1, d - (g + 1));
						var j = CL3D.CopperCubeVariable.getVariable(b);
						if (j) {
							var f = c.substr(0, g);
							f += j.getValueAsString();
							e = f.length + 1;
							f += c.substr(d + 1, c.length - d);
							c = f;
						}
					};
				}
			}
			k.setText(c);
		} else {
			k.setText(this.Text);
		}
	};
};
CL3D.Action.MakeSceneNodeInvisible = function () {
	this.InvisibleMakeType = false;
	this.SceneNodeToMakeInvisible = null;
	this.ChangeCurrentSceneNode = false;
	this.Type = "MakeSceneNodeInvisible";
};
CL3D.Action.MakeSceneNodeInvisible.prototype.execute = function (c, b) {
	if (!c || !b) {
		return;
	}
	var a = null;
	if (this.ChangeCurrentSceneNode) {
		a = c;
	} else {
		if (this.SceneNodeToMakeInvisible != -1) {
			a = b.getSceneNodeFromId(this.SceneNodeToMakeInvisible);
		}
	}
	if (a) {
		switch (this.InvisibleMakeType) {
		case 0:
			a.Visible = false;
			break;
		case 1:
			a.Visible = true;
			break;
		case 2:
			a.Visible = !a.Visible;
			break;
		}
	};
};
CL3D.Action.ChangeSceneNodePosition = function () {
	this.UseAnimatedMovement = false;
	this.TimeNeededForMovementMs = false;
	this.Type = "ChangeSceneNodePosition";
};
CL3D.Action.ChangeSceneNodePosition.prototype.execute = function (a, f) {
	if (!a || !f) {
		return;
	}
	var h = null;
	if (this.ChangeCurrentSceneNode) {
		h = a;
	} else {
		if (this.SceneNodeToChangePosition != -1) {
			h = f.getSceneNodeFromId(this.SceneNodeToChangePosition);
		}
	}
	if (h) {
		var d = null;
		switch (this.PositionChangeType) {
		case 0:
			d = this.Vector.clone();
			break;
		case 1:
			d = h.Pos.add(this.Vector);
			break;
		case 2:
			var g = null;
			if (this.RelativeToCurrentSceneNode) {
				g = a;
			} else {
				if (this.SceneNodeRelativeTo != -1) {
					g = f.getSceneNodeFromId(this.SceneNodeRelativeTo);
				}
			}
			if (g) {
				d = g.Pos.add(this.Vector);
			}
			break;
		case 3:
			var e = this.Vector.getLength();
			var c = h.AbsoluteTransformation;
			var j = new CL3D.Vect3d(1, 0, 0);
			c.rotateVect(j);
			j.setLength(e);
			d = h.Pos.add(j);
			break;
		}
		if (d != null) {
			if (this.UseAnimatedMovement && this.TimeNeededForMovementMs > 0) {
				var b = new CL3D.AnimatorFlyStraight();
				b.Start = h.Pos.clone();
				b.End = d;
				b.TimeForWay = this.TimeNeededForMovementMs;
				b.DeleteMeAfterEndReached = true;
				b.recalculateImidiateValues();
				h.addAnimator(b);
			} else {
				h.Pos = d;
			}
		};
	}
};
CL3D.Action.ChangeSceneNodeRotation = function () {
	this.Type = "ChangeSceneNodeRotation";
};
CL3D.Action.ChangeSceneNodeRotation.prototype.execute = function (c, b) {
	if (!c || !b) {
		return;
	}
	var a = null;
	if (this.ChangeCurrentSceneNode) {
		a = c;
	} else {
		if (this.SceneNodeToChangeRotation != -1) {
			a = b.getSceneNodeFromId(this.SceneNodeToChangeRotation);
		}
	}
	if (a) {
		var e = null;
		switch (this.RotationChangeType) {
		case 0:
			e = this.Vector.clone();
			break;
		case 1:
			e = a.Rot.add(this.Vector);
			break;
		}
		if (e) {
			if (!this.RotateAnimated) {
				a.Rot = e;
			} else {
				var d = new CL3D.AnimatorRotation();
				d.setRotateToTargetAndStop(e, a.Rot, this.TimeNeededForRotationMs);
				a.addAnimator(d);
			}
		};
	}
};
CL3D.Action.ChangeSceneNodeScale = function () {
	this.Type = "ChangeSceneNodeScale";
};
CL3D.Action.ChangeSceneNodeScale.prototype.execute = function (c, b) {
	if (!c || !b) {
		return;
	}
	var a = null;
	if (this.ChangeCurrentSceneNode) {
		a = c;
	} else {
		if (this.SceneNodeToChangeScale != -1) {
			a = b.getSceneNodeFromId(this.SceneNodeToChangeScale);
		}
	}
	if (a) {
		switch (this.ScaleChangeType) {
		case 0:
			a.Scale = this.Vector.clone();
			break;
		case 1:
			a.Scale = a.Scale.multiplyWithVect(this.Vector);
			break;
		}
	};
};
CL3D.Action.ChangeSceneNodeTexture = function () {
	this.Type = "ChangeSceneNodeTexture";
};
CL3D.Action.ChangeSceneNodeTexture.prototype.execute = function (e, d) {
	if (!e || !d) {
		return;
	}
	var a = null;
	if (this.ChangeCurrentSceneNode) {
		a = e;
	} else {
		if (this.SceneNodeToChange != -1) {
			a = d.getSceneNodeFromId(this.SceneNodeToChange);
		}
	}
	if (a) {
		if (a.getType() == "2doverlay") {
			a.setShowImage(this.TheTexture);
		} else {
			var f = a.getMaterialCount();
			for (var c = 0; c < f; ++c) {
				var b = a.getMaterial(c);
				b.Tex1 = this.TheTexture;
			}
		};
	}
};
CL3D.Action.ExecuteJavaScript = function () {
	this.Type = "ExecuteJavaScript";
};
CL3D.Action.ExecuteJavaScript.prototype.execute = function (currentNode, sceneManager) {
	eval(this.JScript);
};
CL3D.Action.OpenWebpage = function () {
	this.Type = "OpenWebpage";
};
CL3D.Action.OpenWebpage.prototype.execute = function (b, a) {
	window.open(this.Webpage, this.Target);
};
CL3D.Action.SetSceneNodeAnimation = function () {
	this.Type = "SetSceneNodeAnimation";
};
CL3D.Action.SetSceneNodeAnimation.prototype.execute = function (b, a) {};
CL3D.Action.SwitchToScene = function (a) {
	this.Engine = a;
	this.Type = "SwitchToScene";
};
CL3D.Action.SwitchToScene.prototype.execute = function (b, a) {
	if (this.Engine) {
		this.Engine.gotoSceneByName(this.SceneName, true);
	}
};
CL3D.Action.SetActiveCamera = function (a) {
	this.Engine = a;
	this.Type = "SetActiveCamera";
};
CL3D.Action.SetActiveCamera.prototype.execute = function (c, b) {
	if (!c || !b) {
		return;
	}
	var a = null;
	if (this.CameraToSetActive != -1) {
		a = b.getSceneNodeFromId(this.CameraToSetActive);
	}
	if (a != null) {
		if (a.getType() == "camera") {
			if (this.Engine) {
				this.Engine.setActiveCameraNextFrame(a);
			}
		};
	}
};
CL3D.Action.SetCameraTarget = function () {
	this.UseAnimatedMovement = false;
	this.TimeNeededForMovementMs = 0;
	this.Type = "SetCameraTarget";
};
CL3D.Action.SetCameraTarget.prototype.execute = function (f, e) {
	if (!f || !e) {
		return;
	}
	var b = null;
	if (this.ChangeCurrentSceneNode) {
		b = f;
	} else {
		if (this.SceneNodeToChangePosition != -1) {
			b = e.getSceneNodeFromId(this.SceneNodeToChangePosition);
		}
	}
	var h = b;
	if (h.getType() != "camera") {
		return;
	}
	var a = h.getTarget().clone();
	switch (this.PositionChangeType) {
	case 0:
		a = this.Vector.clone();
		break;
	case 1:
		a = b.Pos.add(this.Vector);
		break;
	case 2:
		var d = null;
		if (this.RelativeToCurrentSceneNode) {
			d = f;
		} else {
			if (this.SceneNodeRelativeTo != -1) {
				d = e.getSceneNodeFromId(this.SceneNodeRelativeTo);
			}
		}
		if (d) {
			a = d.Pos.add(this.Vector);
		}
		break;
	}
	if (a != null) {
		if (this.UseAnimatedMovement && this.TimeNeededForMovementMs > 0) {
			var g = new CL3D.AnimatorFlyStraight();
			g.Start = h.getTarget().clone();
			g.End = a;
			g.TimeForWay = this.TimeNeededForMovementMs;
			g.DeleteMeAfterEndReached = true;
			g.AnimateCameraTargetInsteadOfPosition = true;
			g.recalculateImidiateValues();
			b.addAnimator(g);
		} else {
			h.setTarget(a);
			var c = h.getAnimatorOfType("camerafps");
			if (c != null) {
				c.lookAt(a);
			}
		};
	}
};
CL3D.Action.Shoot = function () {
	this.ShootType = 0;
	this.Damage = 0;
	this.BulletSpeed = 0;
	this.SceneNodeToUseAsBullet = -1;
	this.WeaponRange = 100;
	this.Type = "Shoot";
	this.SceneNodeToShootFrom = -1;
	this.ShootToCameraTarget = false;
	this.AdditionalDirectionRotation = null;
};
CL3D.Action.Shoot.prototype.execute = function (d, a) {
	if (!d || !a) {
		return;
	}
	var k = new CL3D.Line3d();
	var s = false;
	var j = null;
	var h = null;
	var e = a.getAllSceneNodesWithAnimator("gameai");
	if (this.SceneNodeToShootFrom != -1) {
		var l = a.getSceneNodeFromId(this.SceneNodeToShootFrom);
		if (l != null) {
			s = true;
			j = l;
			k.Start = l.getTransformedBoundingBox().getCenter();
			h = a.getActiveCamera();
			if (this.ShootToCameraTarget && h) {
				var c = new CL3D.Line3d();
				c.Start = h.getAbsolutePosition();
				c.End = h.getTarget();
				var b = c.getVector();
				b.setLength(this.WeaponRange);
				c.End = c.Start.add(b);
				this.shortenRayToClosestCollisionPointWithWorld(c, e, this.WeaponRange, a);
				this.shortenRayToClosestCollisionPointWithAIAnimator(c, e, this.WeaponRange, j, a);
				k.End = c.End;
			} else {
				var u = l.AbsoluteTransformation;
				if (this.AdditionalDirectionRotation) {
					var n = new CL3D.Matrix4();
					n.setRotationDegrees(this.AdditionalDirectionRotation);
					u = u.multiply(n);
				}
				k.End.set(1, 0, 0);
				u.transformVect(k.End);
				k.End.addToThis(k.Start);
			}
		};
	} else {
		if (d != null) {
			var r = d.getAnimatorOfType("gameai");
			if (r && r.isCurrentlyShooting()) {
				k = r.getCurrentlyShootingLine();
				s = true;
			}
		};
	}
	if (!s) {
		var h = a.getActiveCamera();
		if (h) {
			k.Start = h.getAbsolutePosition();
			k.End = h.getTarget();
			s = true;
		}
	}
	if (!s) {
		return;
	}
	var o = k.getVector();
	o.setLength(this.WeaponRange);
	k.End = k.Start.add(o);
	this.shortenRayToClosestCollisionPointWithWorld(k, e, this.WeaponRange, a);
	if (this.ShootType == 1) {
		var t = null;
		if (this.SceneNodeToUseAsBullet != -1) {
			t = a.getSceneNodeFromId(this.SceneNodeToUseAsBullet);
		}
		if (t) {
			var g = t.createClone(a.getRootSceneNode());
			a.getRootSceneNode().addChild(g);
			if (g != null) {
				g.Pos = k.Start;
				g.updateAbsolutePosition();
				g.Visible = true;
				g.Id = -1;
				g.Name = "";
				var q = this.BulletSpeed;
				if (q == 0) {
					q = 1;
				}
				var p = new CL3D.AnimatorFlyStraight();
				p.Start = k.Start;
				p.End = k.End;
				p.TimeForWay = k.getLength() / q;
				p.DeleteMeAfterEndReached = true;
				p.recalculateImidiateValues();
				p.TestShootCollisionWithBullet = true;
				p.ShootCollisionNodeToIgnore = d;
				p.ShootCollisionDamage = this.Damage;
				p.DeleteSceneNodeAfterEndReached = true;
				g.addAnimator(p);
			}
		};
	} else {
		if (this.ShootType == 0) {
			var v = this.WeaponRange;
			var m = this.shortenRayToClosestCollisionPointWithAIAnimator(k, e, this.WeaponRange, j, a);
			if (m != null) {
				var f = m.getAnimatorOfType("gameai");
				if (f) {
					f.OnHit(this.Damage, m);
				}
			};
		}
	};
};
CL3D.Action.Shoot.prototype.shortenRayToClosestCollisionPointWithWorld = function (c, h, b, f) {
	if (h.length != 0) {
		var e = h[0].getAnimatorOfType("gameai");
		if (e) {
			var g = e.World;
			if (g) {
				var a = CL3D.AnimatorOnClick.prototype.static_getDistanceToNearestCollisionPointWithWorld(f, c.Start, c.End, g);
				if (a < b) {
					var d = c.getVector();
					d.setLength(a);
					c.End = c.Start.add(d);
				}
			};
		}
	};
};
CL3D.Action.Shoot.prototype.shortenRayToClosestCollisionPointWithAIAnimator = function (h, l, b, a, j) {
	var e = b;
	var f = null;
	for (var d = 0; d < l.length; ++d) {
		if (l[d] === a) {
			continue;
		}
		var k = l[d].getAnimatorOfType("gameai");
		if (k && !k.isAlive()) {
			continue;
		}
		var g = new Object();
		g.N = 0;
		if (CL3D.AnimatorOnClick.prototype.static_getCollisionDistanceWithNode(j, l[d], h, false, false, null, g)) {
			if (g.N < e) {
				e = g.N;
				f = l[d];
			}
		};
	}
	if (f) {
		var c = h.getVector();
		c.setLength(e);
		h.End = h.Start.add(c);
	}
	return f;
};
CL3D.Action.Shoot.prototype.getWeaponRange = function () {
	return this.WeaponRange;
};
CL3D.Action.SetOrChangeAVariable = function () {
	this.Type = "SetOrChangeAVariable";
};
CL3D.Action.SetOrChangeAVariable.prototype.execute = function (d, c) {
	if (!d || !c) {
		return;
	}
	if (this.VariableName == null) {
		return;
	}
	var f = CL3D.CopperCubeVariable.getVariable(this.VariableName, true);
	if (f == null) {
		return;
	}
	var e = null;
	if (this.ValueType == 1) {
		e = CL3D.CopperCubeVariable.getVariable(this.Value);
		if (e == null) {
			return;
		}
	}
	if (e == null) {
		e = new CL3D.CopperCubeVariable();
		e.setValueAsString(this.Value);
	}
	switch (this.Operation) {
	case 0:
		f.setAsCopy(e);
		break;
	case 1:
		f.setValueAsFloat(f.getValueAsFloat() + e.getValueAsFloat());
		break;
	case 2:
		f.setValueAsFloat(f.getValueAsFloat() - e.getValueAsFloat());
		break;
	case 3:
		var b = e.getValueAsFloat();
		f.setValueAsFloat((b != 0) ? (f.getValueAsFloat() / b) : 0);
		break;
	case 4:
		var a = e.getValueAsFloat();
		f.setValueAsInt((a != 0) ? Math.floor(f.getValueAsFloat() / a) : 0);
		break;
	case 5:
		f.setValueAsFloat(f.getValueAsFloat() * e.getValueAsFloat());
		break;
	case 6:
		f.setValueAsInt(Math.floor(f.getValueAsFloat() * e.getValueAsFloat()));
		break;
	}
};
CL3D.Action.IfVariable = function () {
	this.Type = "IfVariable";
};
CL3D.Action.IfVariable.prototype.execute = function (b, a) {
	if (!b || !a) {
		return;
	}
	if (this.VariableName == null) {
		return;
	}
	var e = CL3D.CopperCubeVariable.getVariable(this.VariableName, true);
	if (e == null) {
		return;
	}
	var d = null;
	if (this.ValueType == 1) {
		d = CL3D.CopperCubeVariable.getVariable(this.Value);
		if (d == null) {
			return;
		}
	}
	if (d == null) {
		d = new CL3D.CopperCubeVariable();
		d.setValueAsString(this.Value);
	}
	var c = false;
	switch (this.ComparisonType) {
	case 0:
	case 1:
		if (e.isString() && d.isString()) {
			c = e.getValueAsString() == d.getValueAsString();
		} else {
			c = Core.equals(e.getValueAsFloat(), d.getValueAsFloat());
		}
		if (this.ComparisonType == 1) {
			c = !c;
		}
		break;
	case 2:
		c = e.getValueAsFloat() > d.getValueAsFloat();
		break;
	case 3:
		c = e.getValueAsFloat() < d.getValueAsFloat();
		break;
	}
	if (c) {
		if (this.TheActionHandler) {
			this.TheActionHandler.execute(b);
		}
	};
};
CL3D.Action.RestartBehaviors = function () {
	this.SceneNodeToRestart = null;
	this.ChangeCurrentSceneNode = false;
	this.Type = "RestartBehaviors";
};
CL3D.Action.RestartBehaviors.prototype.execute = function (f, e) {
	if (!f || !e) {
		return;
	}
	var b = null;
	if (this.ChangeCurrentSceneNode) {
		b = f;
	} else {
		if (this.SceneNodeToRestart != -1) {
			b = e.getSceneNodeFromId(this.SceneNodeToRestart);
		}
	}
	if (b) {
		for (var d = 0; d < b.Animators.length; ++d) {
			var c = b.Animators[d];
			if (c != null) {
				c.reset();
			}
		};
	}
};
CL3D.ActionHandler = function (a) {
	this.Actions = new Array();
	this.SMGr = a;
};
CL3D.ActionHandler.prototype.execute = function (b, c) {
	for (var a = 0; a < this.Actions.length; ++a) {
		this.Actions[a].execute(b, this.SMGr);
	}
};
CL3D.ActionHandler.prototype.addAction = function (b) {
	if (b == null) {
		return;
	}
	this.Actions.push(b);
};
CL3D.ActionHandler.prototype.findAction = function (d) {
	for (var c = 0; c < this.Actions.length; ++c) {
		var b = this.Actions[c];
		if (b.Type == d) {
			return b;
		}
	}
	return null;
};
CL3D.Material = function () {
	this.Type = 0;
	this.Tex1 = null;
	this.Tex2 = null;
	this.ZWriteEnabled = true;
	this.ClampTexture1 = false;
	this.Lighting = false;
};
CL3D.Material.prototype.setFrom = function (a) {
	if (!a) {
		return;
	}
	this.Type = a.Type;
	this.ZWriteEnabled = a.ZWriteEnabled;
	this.Tex1 = a.Tex1;
	this.Tex2 = a.Tex2;
	this.ClampTexture1 = a.ClampTexture1;
	this.Lighting = a.Lighting;
};
CL3D.Material.prototype.clone = function () {
	var a = new CL3D.Material();
	a.Type = this.Type;
	a.ZReadEnabled = this.ZReadEnabled;
	a.ZWriteEnabled = this.ZWriteEnabled;
	a.Tex1 = this.Tex1;
	a.Tex2 = this.Tex2;
	a.ClampTexture1 = this.ClampTexture1;
	a.Lighting = this.Lighting;
	return a;
};
CL3D.Material.prototype.isTransparent = function () {
	return this.Type == CL3D.Material.EMT_TRANSPARENT_ADD_COLOR || this.Type == CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL || this.Type == CL3D.Material.EMT_TRANSPARENT_REFLECTION_2_LAYER;
};
CL3D.Material.prototype.Type = 0;
CL3D.Material.prototype.Tex1 = null;
CL3D.Material.prototype.Tex2 = null;
CL3D.Material.prototype.ZWriteEnabled = true;
CL3D.Material.prototype.ZReadEnabled = true;
CL3D.Material.prototype.ClampTexture1 = false;
CL3D.Material.EMT_SOLID = 0;
CL3D.Material.EMT_LIGHTMAP = 2;
CL3D.Material.EMT_REFLECTION_2_LAYER = 11;
CL3D.Material.EMT_TRANSPARENT_ADD_COLOR = 12;
CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL = 13;
CL3D.Material.EMT_TRANSPARENT_REFLECTION_2_LAYER = 16;
CL3D.MeshBuffer = function () {
	this.Box = new CL3D.Box3d();
	this.Mat = new CL3D.Material();
	this.Indices = new Array();
	this.Vertices = new Array();
	this.RendererNativeArray = null;
	this.DrawMode = CL3D.Renderer.DrawModes.TRIANGLES;
};
CL3D.MeshBuffer.prototype.Box = null;
CL3D.MeshBuffer.prototype.Mat = null;
CL3D.MeshBuffer.prototype.Indices = null;
CL3D.MeshBuffer.prototype.Vertices = null;
CL3D.MeshBuffer.prototype.RendererNativeArray = null;
CL3D.MeshBuffer.prototype.update = function () {
	this.RendererNativeArray = null;
};
CL3D.MeshBuffer.prototype.recalculateBoundingBox = function () {
	if (!this.Vertices || this.Vertices.length == 0) {
		this.Box.reset(0, 0, 0);
	} else {
		var a = this.Vertices[0];
		this.Box.MinEdge = a.Pos.clone();
		this.Box.MaxEdge = a.Pos.clone();
		for (var b = 1; b < this.Vertices.length; ++b) {
			a = this.Vertices[b];
			this.Box.addInternalPointByVector(a.Pos);
		}
	};
};
CL3D.MeshBuffer.prototype.createClone = function () {
	var a = new CL3D.MeshBuffer();
	a.Box = this.Box.clone();
	a.Mat = this.Mat.clone();
	if (this.Vertices) {
		for (var b = 0; b < this.Vertices.length; ++b) {
			a.Vertices.push(this.Vertices[b]);
		}
	}
	if (this.Indices) {
		for (var b = 0; b < this.Indices.length; ++b) {
			a.Indices.push(this.Indices[b]);
		}
	}
	return a;
};
CL3D.Mesh = function () {
	this.Box = new CL3D.Box3d();
	this.MeshBuffers = new Array();
};
CL3D.Mesh.prototype.AddMeshBuffer = function (a) {
	this.MeshBuffers.push(a);
};
CL3D.Mesh.prototype.GetMeshBuffers = function () {
	return this.MeshBuffers;
};
CL3D.Mesh.prototype.GetPolyCount = function () {
	var b = 0;
	if (this.MeshBuffers) {
		for (var a = 0; a < this.MeshBuffers.length; ++a) {
			if (this.MeshBuffers[a].Indices) {
				b += this.MeshBuffers[a].Indices.length;
			}
		};
	}
	return b / 3;
};
CL3D.Mesh.prototype.createClone = function () {
	var a = new CL3D.Mesh();
	a = this.Box.clone();
	if (this.MeshBuffers) {
		for (var b = 0; b < this.MeshBuffers.length; ++b) {
			if (this.MeshBuffers[b]) {
				a.MeshBuffers.push(this.MeshBuffers[b].createClone());
			}
		};
	}
	return a;
};
CL3D.MeshCache = function () {
	this.Meshes = new Array();
};
CL3D.MeshCache.prototype.getMeshFromName = function (a) {
	for (var c = 0; c < this.Meshes.length; ++c) {
		var b = this.Meshes[c];
		if (b.Name == a) {
			return b;
		}
	}
	return null;
};
CL3D.MeshCache.prototype.addMesh = function (a) {
	if (a != null) {
		this.Meshes.push(a);
	}
};
CL3D.SkinnedMeshJoint = function () {
	this.Name = "";
	this.LocalMatrix = new CL3D.Matrix4();
	this.Children = new Array();
	this.AttachedMeshes = new Array();
	this.PositionKeys = new Array();
	this.ScaleKeys = new Array();
	this.RotationKeys = new Array();
	this.Weights = new Array();
	this.GlobalMatrix = new CL3D.Matrix4();
	this.GlobalAnimatedMatrix = new CL3D.Matrix4();
	this.LocalAnimatedMatrix = new CL3D.Matrix4();
	this.Animatedposition = new CL3D.Vect3d(0, 0, 0);
	this.Animatedscale = new CL3D.Vect3d(1, 1, 1);
	this.Animatedrotation = new CL3D.Quaternion();
	this.GlobalInversedMatrix = new CL3D.Matrix4();
	this.GlobalSkinningSpace = false;
	this.positionHint = -1;
	this.scaleHint = -1;
	this.rotationHint = -1;
};
CL3D.SkinnedMeshWeight = function () {
	this.buffer_id = 0;
	this.vertex_id = 0;
	this.strength = 0;
	this.StaticPos = new CL3D.Vect3d();
	this.StaticNormal = new CL3D.Vect3d();
};
CL3D.SkinnedMeshScaleKey = function () {
	this.frame = 0;
	this.scale = new CL3D.Vect3d();
};
CL3D.SkinnedMeshPositionKey = function () {
	this.frame = 0;
	this.position = new CL3D.Vect3d();
};
CL3D.SkinnedMeshRotationKey = function () {
	this.frame = 0;
	this.rotation = new CL3D.Quaternion();
};
CL3D.NamedAnimationRange = function () {
	this.Name = "";
	this.Begin = 0;
	this.End = 0;
	this.FPS = 0;
};
CL3D.NamedAnimationRange.prototype.Name = "";
CL3D.NamedAnimationRange.prototype.Begin = 0;
CL3D.NamedAnimationRange.prototype.End = 0;
CL3D.NamedAnimationRange.prototype.FPS = 0;
CL3D.SkinnedMesh = function () {
	this.Name = "";
	this.AnimatedMeshesToLink = new Array();
	this.AnimationFrames = 0;
	this.LocalBuffers = new Array();
	this.AllJoints = new Array();
	this.RootJoints = new Array();
	this.DefaultFPS = 0;
	this.HasAnimation = false;
	this.PreparedForSkinning = false;
	this.LastAnimatedFrame = 0;
	this.LastSkinnedFrame = 0;
	this.BoneControlUsed = 0;
	this.BoundingBox = new CL3D.Box3d();
	this.InterpolationMode = 1;
	this.AnimateNormals = false;
	this.Vertices_Moved = new Array();
	this.NamedAnimationRanges = new Array();
};
CL3D.SkinnedMesh.prototype.AddMeshBuffer = function (a) {
	this.LocalBuffers.push(a);
};
CL3D.SkinnedMesh.prototype.getFrameCount = function () {
	return Math.floor(this.AnimationFrames);
};
CL3D.SkinnedMesh.prototype.getBoundingBox = function () {
	return this.BoundingBox;
};
CL3D.SkinnedMesh.prototype.finalize = function () {
	this.LastAnimatedFrame = -1;
	this.LastSkinnedFrame = -1;
	var g = 0;
	var f = 0;
	var h;
	var d;
	for (var k = 0; k < this.AllJoints.length; ++k) {
		var m = false;
		for (g = 0; g < this.AllJoints.length; ++g) {
			d = this.AllJoints[g];
			for (var c = 0; c < d.Children.length; ++c) {
				if (d.Children[c] === this.AllJoints[k]) {
					m = true;
				}
			};
		}
		if (!m) {
			this.RootJoints.push(this.AllJoints[k]);
		}
	}
	for (g = 0; g < this.LocalBuffers.length; ++g) {
		var b = new Array();
		this.Vertices_Moved.push(b);
		h = this.LocalBuffers[g];
		var a = h.Vertices.length;
		for (var l = 0; l < a; ++l) {
			b.push(false);
		}
	}
	this.checkForAnimation();
	this.CalculateGlobalMatrices(null, null);
	for (g = 0; g < this.AllJoints.length; ++g) {
		d = this.AllJoints[g];
		for (f = 0; f < d.AttachedMeshes.length; ++f) {
			h = this.LocalBuffers[d.AttachedMeshes[f]];
			h.Transformation = d.GlobalAnimatedMatrix.clone();
		}
	}
	if (this.LocalBuffers.length == 0) {
		this.BoundingBox.MinEdge.set(0, 0, 0);
		this.BoundingBox.MaxEdge.set(0, 0, 0);
	} else {
		h = this.LocalBuffers[0];
		this.BoundingBox.MinEdge = h.Box.MinEdge.clone();
		this.BoundingBox.MaxEdge = h.Box.MaxEdge.clone();
		for (g = 1; g < this.LocalBuffers.length; ++g) {
			h = this.LocalBuffers[g];
			if (h.Transformation == null) {
				this.BoundingBox.addInternalPointByVector(h.Box.MinEdge);
				this.BoundingBox.addInternalPointByVector(h.Box.MaxEdge);
			} else {
				var e = h.Box.clone();
				h.Transformation.transformBoxEx(e);
				this.BoundingBox.addInternalPointByVector(e.MinEdge);
				this.BoundingBox.addInternalPointByVector(e.MaxEdge);
			}
		};
	}
};
CL3D.SkinnedMesh.prototype.checkForAnimation = function () {
	this.HasAnimation = false;
	var f = 0;
	var e = 0;
	var g;
	var c;
	for (f = 0; f < this.AllJoints.length; ++f) {
		c = this.AllJoints[f];
		if (c.PositionKeys.length || c.ScaleKeys.length || c.RotationKeys.length || c.Weights.length) {
			this.HasAnimation = true;
			break;
		}
	}
	if (this.HasAnimation) {
		this.AnimationFrames = 0;
		for (f = 0; f < this.AllJoints.length; ++f) {
			c = this.AllJoints[f];
			if (c.PositionKeys.length) {
				var h = c.PositionKeys[c.PositionKeys.length - 1];
				if (h.frame > this.AnimationFrames) {
					this.AnimationFrames = h.frame;
				}
			}
			if (c.ScaleKeys.length) {
				var l = c.ScaleKeys[c.ScaleKeys.length - 1];
				if (l.frame > this.AnimationFrames) {
					this.AnimationFrames = l.frame;
				}
			}
			if (c.RotationKeys.length) {
				var m = c.RotationKeys[c.RotationKeys.length - 1];
				if (m.frame > this.AnimationFrames) {
					this.AnimationFrames = m.frame;
				}
			};
		}
	}
	if (this.HasAnimation && !this.PreparedForSkinning) {
		this.PreparedForSkinning = true;
		for (f = 0; f < this.AllJoints.length; ++f) {
			c = this.AllJoints[f];
			for (e = 0; e < c.Weights.length; ++e) {
				var k = c.Weights[e];
				var d = k.buffer_id;
				var b = k.vertex_id;
				g = this.LocalBuffers[d];
				var a = g.Vertices[b];
				k.StaticPos = a.Pos.clone();
				k.StaticNormal = a.Normal.clone();
			}
		};
	}
};
CL3D.SkinnedMesh.prototype.CalculateGlobalMatrices = function (d, c) {
	if (d == null && c != null) {
		return;
	}
	if (d == null) {
		for (var b = 0; b < this.RootJoints.length; ++b) {
			this.CalculateGlobalMatrices(this.RootJoints[b], null);
		}
		return;
	}
	if (c == null) {
		d.GlobalMatrix = d.LocalMatrix.clone();
	} else {
		d.GlobalMatrix = c.GlobalMatrix.multiply(d.LocalMatrix);
	}
	d.LocalAnimatedMatrix = d.LocalMatrix.clone();
	d.GlobalAnimatedMatrix = d.GlobalMatrix.clone();
	if (d.GlobalInversedMatrix.isIdentity()) {
		d.GlobalInversedMatrix = d.GlobalMatrix.clone();
		d.GlobalInversedMatrix.makeInverse();
	}
	for (var a = 0; a < d.Children.length; ++a) {
		this.CalculateGlobalMatrices(d.Children[a], d);
	}
};
CL3D.SkinnedMesh.prototype.animateMesh = function (g, b) {
	if (b == null) {
		b = 1;
	}
	if (!this.HasAnimation || this.LastAnimatedFrame == g) {
		return false;
	}
	this.LastAnimatedFrame = g;
	if (b <= 0) {
		return false;
	}
	for (var d = 0; d < this.AllJoints.length; ++d) {
		var e = this.AllJoints[d];
		var a = e.Animatedposition.clone();
		var f = e.Animatedscale.clone();
		var c = e.Animatedrotation.clone();
		this.getFrameData(g, e, a, e.positionHint, f, e.scaleHint, c, e.rotationHint);
		e.Animatedposition = a.clone();
		e.Animatedscale = f.clone();
		e.Animatedrotation = c.clone();
	}
	this.buildAll_LocalAnimatedMatrices();
	return true;
};
CL3D.SkinnedMesh.prototype.getFrameData = function (n, x, v, l, w, r, o, h) {
	var s = -1;
	var m = -1;
	var d = -1;
	var c = x.PositionKeys;
	var t = x.ScaleKeys;
	var a = x.RotationKeys;
	var g;
	var b;
	var q;
	var p;
	var k;
	var j;
	if (c.length) {
		s = -1;
		if (s == -1) {
			for (p = 0; p < c.length; ++p) {
				g = c[p];
				if (g.frame >= n) {
					s = p;
					l = p;
					break;
				}
			};
		}
		if (s != -1) {
			if (this.InterpolationMode == 0 || s == 0) {
				g = c[s];
				v = g.position.clone();
			} else {
				if (this.InterpolationMode == 1) {
					g = c[s];
					var f = c[s - 1];
					k = n - g.frame;
					j = f.frame - n;
					v.setTo(f.position.substract(g.position).multiplyThisWithScalReturnMe(1 / (k + j)).multiplyThisWithScalReturnMe(k).addToThisReturnMe(g.position));
				}
			};
		}
	}
	if (t.length) {
		m = -1;
		if (m == -1) {
			for (p = 0; p < t.length; ++p) {
				b = t[p];
				if (b.frame >= n) {
					m = p;
					r = p;
					break;
				}
			};
		}
		if (m != -1) {
			if (this.InterpolationMode == 0 || m == 0) {
				b = t[m];
				w = b.scale.clone();
			} else {
				if (this.InterpolationMode == 1) {
					b = t[m];
					var u = t[m - 1];
					k = n - b.frame;
					j = u.frame - n;
					w.setTo(u.scale.substract(b.scale).multiplyThisWithScalReturnMe(1 / (k + j)).multiplyThisWithScalReturnMe(k).addToThisReturnMe(b.scale));
				}
			};
		}
	}
	if (a.length) {
		d = -1;
		if (d == -1) {
			for (p = 0; p < a.length; ++p) {
				q = a[p];
				if (q.frame >= n) {
					d = p;
					h = p;
					break;
				}
			};
		}
		if (d != -1) {
			if (this.InterpolationMode == 0 || d == 0) {
				q = a[d];
				o = q.rotation.clone();
			} else {
				if (this.InterpolationMode == 1) {
					q = a[d];
					var e = a[d - 1];
					k = n - q.frame;
					j = e.frame - n;
					o.slerp(q.rotation, e.rotation, k / (k + j));
				}
			};
		}
	};
};
CL3D.SkinnedMesh.prototype.buildAll_LocalAnimatedMatrices = function () {
	for (var b = 0; b < this.AllJoints.length; ++b) {
		var d = this.AllJoints[b];
		if (d.PositionKeys.length || d.ScaleKeys.length || d.RotationKeys.length) {
			if (!d.Animatedrotation) {
				d.Animatedrotation = new CL3D.Quaternion();
			}
			if (!d.Animatedposition) {
				d.Animatedposition = new CL3D.Vect3d();
			}
			d.LocalAnimatedMatrix = d.Animatedrotation.getMatrix();
			var a = d.LocalAnimatedMatrix;
			var c = d.Animatedposition;
			a.m00 += c.X * a.m03;
			a.m01 += c.Y * a.m03;
			a.m02 += c.Z * a.m03;
			a.m04 += c.X * a.m07;
			a.m05 += c.Y * a.m07;
			a.m06 += c.Z * a.m07;
			a.m08 += c.X * a.m11;
			a.m09 += c.Y * a.m11;
			a.m10 += c.Z * a.m11;
			a.m12 += c.X * a.m15;
			a.m13 += c.Y * a.m15;
			a.m14 += c.Z * a.m15;
			a.bIsIdentity = false;
			d.GlobalSkinningSpace = false;
			if (d.ScaleKeys.length && d.Animatedscale && !d.Animatedscale.equalsByNumbers(1, 1, 1)) {
				c = d.Animatedscale;
				a.m00 *= c.X;
				a.m01 *= c.X;
				a.m02 *= c.X;
				a.m03 *= c.X;
				a.m04 *= c.Y;
				a.m05 *= c.Y;
				a.m06 *= c.Y;
				a.m07 *= c.Y;
				a.m08 *= c.Z;
				a.m09 *= c.Z;
				a.m10 *= c.Z;
				a.m11 *= c.Z;
			}
		} else {
			d.LocalAnimatedMatrix = d.LocalMatrix.clone();
		}
	};
};
CL3D.SkinnedMesh.prototype.updateBoundingBox = function () {
	this.BoundingBox.MinEdge.set(0, 0, 0);
	this.BoundingBox.MaxEdge.set(0, 0, 0);
	if (this.LocalBuffers.length) {
		var a = this.LocalBuffers[0];
		a.recalculateBoundingBox();
		this.BoundingBox.MinEdge = a.Box.MinEdge.clone();
		this.BoundingBox.MaxEdge = a.Box.MaxEdge.clone();
		for (var c = 1; c < this.LocalBuffers.length; ++c) {
			a = this.LocalBuffers[c];
			a.recalculateBoundingBox();
			if (a.Transformation == null) {
				this.BoundingBox.addInternalPointByVector(a.Box.MinEdge);
				this.BoundingBox.addInternalPointByVector(a.Box.MaxEdge);
			} else {
				var b = a.Box.clone();
				a.Transformation.transformBoxEx(b);
				this.BoundingBox.addInternalPointByVector(b.MinEdge);
				this.BoundingBox.addInternalPointByVector(b.MaxEdge);
			}
		};
	}
};
CL3D.SkinnedMesh.prototype.buildAll_GlobalAnimatedMatrices = function (e, d) {
	if (e == null) {
		for (var c = 0; c < this.RootJoints.length; ++c) {
			var a = this.RootJoints[c];
			this.buildAll_GlobalAnimatedMatrices(a, null);
		}
		return;
	} else {
		if (d == null || e.GlobalSkinningSpace) {
			e.GlobalAnimatedMatrix = e.LocalAnimatedMatrix.clone();
		} else {
			e.GlobalAnimatedMatrix = d.GlobalAnimatedMatrix.multiply(e.LocalAnimatedMatrix);
		}
	}
	for (var b = 0; b < e.Children.length; ++b) {
		this.buildAll_GlobalAnimatedMatrices(e.Children[b], e);
	}
};
CL3D.SkinnedMesh.prototype.skinMesh = function () {
	if (!this.HasAnimation) {
		return;
	}
	this.buildAll_GlobalAnimatedMatrices(null, null);
	var e = 0;
	var d = 0;
	var b;
	for (e = 0; e < this.AllJoints.length; ++e) {
		var f = this.AllJoints[e];
		for (d = 0; d < f.AttachedMeshes.length; ++d) {
			b = this.LocalBuffers[f.AttachedMeshes[d]];
			b.Transformation = f.GlobalAnimatedMatrix.clone();
		}
	}
	for (e = 0; e < this.LocalBuffers.length; ++e) {
		var c = this.Vertices_Moved[e];
		for (d = 0; d < c.length; ++d) {
			c[d] = false;
		}
	}
	for (e = 0; e < this.RootJoints.length; ++e) {
		var a = this.RootJoints[e];
		this.skinJoint(a, null);
	}
};
CL3D.SkinnedMesh.prototype.skinJoint = function (e, b) {
	if (e.Weights.length) {
		var m = e.GlobalAnimatedMatrix.multiply(e.GlobalInversedMatrix);
		var d = new CL3D.Vect3d();
		var c = new CL3D.Vect3d();
		var f = this.LocalBuffers;
		var l;
		var a;
		for (var h = 0; h < e.Weights.length; ++h) {
			var k = e.Weights[h];
			m.transformVect2(d, k.StaticPos);
			if (this.AnimateNormals) {
				m.rotateVect2(c, k.StaticNormal);
			}
			l = f[k.buffer_id];
			a = l.Vertices[k.vertex_id];
			if (!this.Vertices_Moved[k.buffer_id][k.vertex_id]) {
				this.Vertices_Moved[k.buffer_id][k.vertex_id] = true;
				a.Pos = d.multiplyWithScal(k.strength);
				if (this.AnimateNormals) {
					a.Normal = c.multiplyWithScal(k.strength);
				}
			} else {
				a.Pos.addToThis(d.multiplyWithScal(k.strength));
				if (this.AnimateNormals) {
					a.Normal += c.multiplyWithScal(k.strength);
				}
			};
		}
	}
	for (var g = 0; g < e.Children.length; ++g) {
		this.skinJoint(e.Children[g], e);
	}
};
CL3D.SkinnedMesh.prototype.getNamedAnimationRangeByName = function (e) {
	if (!e) {
		return null;
	}
	var b = this.NamedAnimationRanges.length;
	var c = e.toLowerCase();
	for (var a = 0; a < b; ++a) {
		var d = this.NamedAnimationRanges[a];
		if (d.Name && d.Name.toLowerCase() == c) {
			return d;
		}
	}
	return null;
};
CL3D.SkinnedMesh.prototype.addNamedAnimationRange = function (a) {
	this.NamedAnimationRanges.push(a);
};
CL3D.TextureManager = function () {
	this.Textures = new Array();
	this.TheRenderer = null;
	this.PathRoot = "";
};
CL3D.TextureManager.prototype.getTexture = function (b, a) {
	if (b == null || b == "") {
		return null;
	}
	var c = this.getTextureFromName(b);
	if (c != null) {
		return c;
	}
	if (a) {
		c = new CL3D.Texture();
		c.Name = b;
		this.addTexture(c);
		var d = this;
		c.Image = new Image();
		c.Image.onload = function () {
			d.onTextureLoaded(c);
		};
		c.Image.src = c.Name;
		return c;
	}
	return null;
};
CL3D.TextureManager.prototype.getTextureCount = function () {
	return this.Textures.length;
};
CL3D.TextureManager.prototype.onTextureLoaded = function (a) {
	var b = this.TheRenderer;
	if (b == null) {
		return;
	}
	b.finalizeLoadedImageTexture(a);
	a.Loaded = true;
};
CL3D.TextureManager.prototype.getCountOfTexturesToLoad = function () {
	var a = 0;
	for (var c = 0; c < this.Textures.length; ++c) {
		var b = this.Textures[c];
		if (b.Loaded == false) {
			++a;
		}
	}
	return a;
};
CL3D.TextureManager.prototype.getTextureFromName = function (a) {
	for (var c = 0; c < this.Textures.length; ++c) {
		var b = this.Textures[c];
		if (b.Name == a) {
			return b;
		}
	}
	return null;
};
CL3D.TextureManager.prototype.addTexture = function (a) {
	if (a != null) {
		if (this.getTextureFromName(a.Name) != null) {
			CL3D.gCCDebugOutput.print("ERROR! Cannot add the texture multiple times: " + a.Name);
		}
		this.Textures.push(a);
	}
};
CL3D.BinaryStream = function (a) {
	this._buffer = a;
	this._length = a.length;
	this._offset = 0;
	this._bitBuffer = null;
	this._bitOffset = 8;
	this.bigEndian = false;
};
CL3D.BinaryStream.prototype.bytesAvailable = function () {
	return this._length - this._offset;
};
CL3D.BinaryStream.prototype.getPosition = function () {
	return this._offset;
};
CL3D.BinaryStream.prototype.readInt = function () {
	return this.readSI32();
};
CL3D.BinaryStream.prototype.readByte = function () {
	return this.readSI8();
};
CL3D.BinaryStream.prototype.readByteAt = function (a) {
	return this._buffer.charCodeAt(a) & 255;
};
CL3D.BinaryStream.prototype.readBoolean = function () {
	return this.readSI8() != 0;
};
CL3D.BinaryStream.prototype.readShort = function () {
	return this.readUnsignedShort();
};
CL3D.BinaryStream.prototype.readNumber = function (a) {
	var c = 0;
	var d = this._offset;
	var b = d + a;
	while (b > d) {
		c = c * 256 + this.readByteAt(--b);
	}
	this._offset += a;
	return c;
};
CL3D.BinaryStream.prototype.readSNumber = function (b) {
	var c = this.readNumber(b);
	var a = 1 << (b * 8 - 1);
	if (c & a) {
		c = (~c + 1) * -1;
	}
	return c;
};
CL3D.BinaryStream.prototype.readUnsignedShort = function () {
	return this.readUI16();
};
CL3D.BinaryStream.prototype.readUnsignedInt = function () {
	return this.readUI32();
};
CL3D.BinaryStream.prototype.readSI8 = function () {
	return this.readSNumber(1);
};
CL3D.BinaryStream.prototype.readSI16 = function () {
	return this.readSNumber(2);
};
CL3D.BinaryStream.prototype.readSI32 = function () {
	return this.readSNumber(4);
};
CL3D.BinaryStream.prototype.readUI8 = function () {
	return this.readNumber(1);
};
CL3D.BinaryStream.prototype.readUI16 = function () {
	return this.readNumber(2);
};
CL3D.BinaryStream.prototype.readUI24 = function () {
	return this.readNumber(3);
};
CL3D.BinaryStream.prototype.readUI32 = function () {
	return this.readNumber(4);
};
CL3D.BinaryStream.prototype.readFixed = function () {
	return this._readFixedPoint(32, 16);
};
CL3D.BinaryStream.prototype.readFixed8 = function () {
	return this._readFixedPoint(16, 8);
};
CL3D.BinaryStream.prototype._readFixedPoint = function (c, a) {
	var b = this.readSB(c);
	b = b * Math.pow(2, -a);
	return b;
};
CL3D.BinaryStream.prototype.readFloat16 = function () {
	return this._readFloatingPoint(5, 10);
};
CL3D.BinaryStream.prototype.readFloat = function () {
	var a = this.decodeFloat32fast(this._buffer, this._offset);
	this._offset += 4;
	return a;
};
CL3D.BinaryStream.prototype.readDouble = function () {
	var a = this._buffer.substring(this._offset, this._offset + 8);
	var b = this.decodeFloat(a, 52, 11);
	this._offset += 8;
	return b;
};
CL3D.BinaryStream.prototype.decodeFloat32fast = function (d, c) {
	var h = d.charCodeAt(c + 3) & 255,
		g = d.charCodeAt(c + 2) & 255,
		f = d.charCodeAt(c + 1) & 255,
		e = d.charCodeAt(c + 0) & 255;
	var a = 1 - (2 * (h >> 7));
	var b = (((h << 1) & 255) | (g >> 7)) - 127;
	var j = ((g & 127) << 16) | (f << 8) | e;
	if (j == 0 && b == -127) {
		return 0;
	}
	return a * (1 + j * Math.pow(2, -23)) * Math.pow(2, b);
};
CL3D.BinaryStream.prototype.decodeFloat = function (f, c, o) {
	var m = ((m = new this.Buffer(this.bigEndian, f)), m),
		g = Math.pow(2, o - 1) - 1,
		k = m.readBits(c + o, 1),
		l = m.readBits(c, o),
		j = 0,
		d = 2,
		a = m.buffer.length + (-c >> 3) - 1,
		e, h, n;
	do {
		for (e = m.buffer[++a], h = c % 8 || 8, n = 1 << h; n >>= 1;
		(e & n) && (j += 1 / d), d *= 2) {}
	}
	while (c -= h);
	return l == (g << 1) + 1 ? j ? NaN : k ? -Infinity : +Infinity : (1 + k * -2) * (l || j ? !l ? Math.pow(2, -g + 1) * j : Math.pow(2, l - g) * (1 + j) : 0);
};
CL3D.BinaryStream.prototype.Buffer = function (b, a) {
	this.bigEndian = b || 0, this.buffer = [], this.setBuffer(a);
};
CL3D.BinaryStream.prototype.Buffer.prototype.readBits = function (b, d) {
	function c(l, k) {
		for (++k; --k; l = ((l %= 2147483647 + 1) & 1073741824) == 1073741824 ? l * 2 : (l - 1073741824) * 2 + 2147483647 + 1) {}
		return l;
	}
	if (b < 0 || d <= 0) {
		return 0;
	}
	for (var e, f = b % 8, a = this.buffer.length - (b >> 3) - 1, j = this.buffer.length + (-(b + d) >> 3), h = a - j, g = ((this.buffer[a] >> f) & ((1 << (h ? 8 - f : d)) - 1)) + (h && (e = (b + d) % 8) ? (this.buffer[j++] & ((1 << e) - 1)) << (h-- << 3) - f : 0); h; g += c(this.buffer[j++], (h-- << 3) - f)) {}
	return g;
};
CL3D.BinaryStream.prototype.Buffer.prototype.setBuffer = function (e) {
	if (e) {
		for (var c, d = c = e.length, a = this.buffer = new Array(c); d; a[c - d] = e.charCodeAt(--d)) {}
		this.bigEndian && a.reverse();
	}
};
CL3D.BinaryStream.prototype.Buffer.prototype.hasNeededBits = function (a) {
	return this.buffer.length >= -(-a >> 3);
};
CL3D.BinaryStream.prototype.readSB = function (c) {
	var b = this.readUB(c);
	var a = 1 << (c - 1);
	if (b & a) {
		b -= Math.pow(2, c);
	}
	return b;
};
CL3D.BinaryStream.prototype.readUB = function (e) {
	var d = 0;
	var c = this;
	var b = e;
	while (b--) {
		if (c._bitOffset == 8) {
			c._bitBuffer = c.readUI8();
			c._bitOffset = 0;
		}
		var a = 128 >> c._bitOffset;
		d = d * 2 + (c._bitBuffer & a ? 1 : 0);
		c._bitOffset++;
	}
	return d;
};
CL3D.BinaryStream.prototype.readFB = function (a) {
	return this._readFixedPoint(a, 16);
};
CL3D.BinaryStream.prototype.readString = function (d) {
	var c = [];
	var a = d || this._length - this._offset;
	while (a--) {
		var b = this.readNumber(1);
		if (d || b) {
			c.push(String.fromCharCode(b));
		} else {
			break;
		}
	}
	return c.join("");
};
CL3D.BinaryStream.prototype.readBool = function (a) {
	return !!this.readUB(a || 1);
};
CL3D.BinaryStream.prototype.tell = function () {
	return this._offset;
};
CL3D.BinaryStream.prototype.seek = function (a, b) {
	this._offset = (b ? 0 : this._offset) + a;
	return this;
};
CL3D.BinaryStream.prototype.reset = function () {
	this._offset = 0;
	return this;
};
CL3D.Renderer = function () {
	this.canvas = null;
	this.gl = null;
	this.width = 0;
	this.height = 0;
	this.textureWasLoadedFlag = false;
	this.Projection = new CL3D.Matrix4();
	this.View = new CL3D.Matrix4();
	this.World = new CL3D.Matrix4();
	this.programStandardMaterial = null;
	this.programLightmapMaterial = null;
	this.MaterialPrograms = new Array();
	this.MinExternalMaterialTypeId = 20;
	this.Program2DDrawingColorOnly = null;
	this.Program2DDrawingTextureOnly = null;
	this.Program2DDrawingCanvasFontColor = null;
	//this.OnChangeMaterial = null;
	this.currentGLProgram = null;
};
CL3D.Renderer.DrawModes = {
	POINTS: 0x0000,
	LINES: 0x0001,
	LINE_LOOP: 0x0002,
	LINE_STRIP: 0x0003,
	TRIANGLES: 0x0004,
	TRIANGLE_STRIP: 0x0005,
	TRIANGLE_FAN: 0x0006
};
CL3D.Renderer.prototype.OnChangeMaterial = null;
CL3D.Renderer.prototype.getWidth = function () {
	return this.width;
};
CL3D.Renderer.prototype.getAndResetTextureWasLoadedFlag = function () {
	var a = this.textureWasLoadedFlag;
	this.textureWasLoadedFlag = false;
	return a;
};
CL3D.Renderer.prototype.getWebGL = function () {
	return this.gl;
};
CL3D.Renderer.prototype.getHeight = function () {
	return this.height;
};
CL3D.Renderer.prototype.registerFrame = function () {};
CL3D.Renderer.prototype.drawMesh = function (c) {
	if (c == null) {
		return;
	}
	for (var b = 0; b < c.MeshBuffers.length; ++b) {
		var a = c.MeshBuffers[b];
		this.setMaterial(a.Mat);
		this.drawMeshBuffer(a);
	}
};
CL3D.Renderer.prototype.setMaterial = function (b) {
	if (b == null) {
		return;
	}
	var d = this.gl;
	if (d == null) {
		return;
	}
	var a = null;
	try {
		a = this.MaterialPrograms[b.Type];
	} catch (c) {}
	if (a) {
		this.currentGLProgram = a;
		d.useProgram(a);
		if (this.OnChangeMaterial != null) {
			try {
				this.OnChangeMaterial(b.Type);
			} catch (c) {}
		}
		if (a.blendenabled) {
			d.enable(d.BLEND);
			//d.blendFunc(a.blendsfactor, a.blenddfactor);
			d.blendFuncSeparate(a.blendsfactor, a.blenddfactor, d.ONE, d.ONE);
		} else {
			d.disable(d.BLEND);
		}
		if (!b.ZWriteEnabled || b.isTransparent()) {
			d.depthMask(false);
		} else {
			d.depthMask(true);
		}
		if (b.ZReadEnabled) {
			d.enable(d.DEPTH_TEST);
		} else {
			d.disable(d.DEPTH_TEST);
		}
	}
	if (b.Tex1 && b.Tex1.Loaded) {
		d.activeTexture(d.TEXTURE0);
		d.bindTexture(d.TEXTURE_2D, b.Tex1.Texture);
		d.texParameteri(d.TEXTURE_2D, d.TEXTURE_WRAP_S, b.ClampTexture1 ? d.CLAMP_TO_EDGE : d.REPEAT);
		d.texParameteri(d.TEXTURE_2D, d.TEXTURE_WRAP_T, b.ClampTexture1 ? d.CLAMP_TO_EDGE : d.REPEAT);
	} else {
		d.activeTexture(d.TEXTURE0);
		d.bindTexture(d.TEXTURE_2D, null);
	}
	if (a) {
		d.uniform1i(d.getUniformLocation(a, "texture1"), 0);
	}
	if (b.Tex2 && b.Tex2.Loaded) {
		d.activeTexture(d.TEXTURE1);
		d.bindTexture(d.TEXTURE_2D, b.Tex2.Texture);
	} else {
		d.activeTexture(d.TEXTURE1);
		d.bindTexture(d.TEXTURE_2D, null);
	}
	if (a) {
		d.uniform1i(d.getUniformLocation(a, "texture2"), 1);
	}
};
CL3D.Renderer.prototype.drawMeshBuffer = function (a) {
	if (a == null) {
		return;
	}
	if (this.gl == null) {
		return;
	}
	if (a.RendererNativeArray == null) {
		var g = this.gl;
		var f = new Object();
		var h = a.Vertices.length;
		var k = new WebGLFloatArray(h * 3);
		var b = new WebGLFloatArray(h * 3);
		var l = new WebGLFloatArray(h * 2);
		var c = new WebGLFloatArray(h * 2);
		for (var e = 0; e < h; ++e) {
			var o = a.Vertices[e];
			k[e * 3 + 0] = o.Pos.X;
			k[e * 3 + 1] = o.Pos.Y;
			k[e * 3 + 2] = o.Pos.Z;
			b[e * 3 + 0] = o.Normal.X;
			b[e * 3 + 1] = o.Normal.Y;
			b[e * 3 + 2] = o.Normal.Z;
			l[e * 2 + 0] = o.TCoords.X;
			l[e * 2 + 1] = o.TCoords.Y;
			c[e * 2 + 0] = o.TCoords2.X;
			c[e * 2 + 1] = o.TCoords2.Y;
		}
		var m = a.Indices.length;
		var n = new WebGLUnsignedShortArray(m);
		switch(a.DrawMode)
		{
		case CL3D.Renderer.DrawModes.TRIANGLES:
			for (var d = 0; d < m; d += 3) {
				n[d + 0] = a.Indices[d + 0];
				n[d + 1] = a.Indices[d + 2];
				n[d + 2] = a.Indices[d + 1];
			}

			break;
		default:
			for (var d = 0; d < m; ++d)
				n[d] = a.Indices[d];
		}
		f.positionBuffer = g.createBuffer();
		g.bindBuffer(g.ARRAY_BUFFER, f.positionBuffer);
		g.bufferData(g.ARRAY_BUFFER, k, g.STATIC_DRAW);
		f.texcoordsBuffer = g.createBuffer();
		g.bindBuffer(g.ARRAY_BUFFER, f.texcoordsBuffer);
		g.bufferData(g.ARRAY_BUFFER, l, g.STATIC_DRAW);
		f.texcoordsBuffer2 = g.createBuffer();
		g.bindBuffer(g.ARRAY_BUFFER, f.texcoordsBuffer2);
		g.bufferData(g.ARRAY_BUFFER, c, g.STATIC_DRAW);
		f.normalBuffer = g.createBuffer();
		g.bindBuffer(g.ARRAY_BUFFER, f.normalBuffer);
		g.bufferData(g.ARRAY_BUFFER, b, g.STATIC_DRAW);
		g.bindBuffer(g.ARRAY_BUFFER, null);
		f.indexBuffer = g.createBuffer();
		g.bindBuffer(g.ELEMENT_ARRAY_BUFFER, f.indexBuffer);
		g.bufferData(g.ELEMENT_ARRAY_BUFFER, n, g.STATIC_DRAW);
		f.indexCount = m;
		g.bindBuffer(g.ELEMENT_ARRAY_BUFFER, null);
		f.drawMode = a.DrawMode;
		a.RendererNativeArray = f;
	}
	this.drawWebGlStaticGeometry(a.RendererNativeArray);
};
CL3D.Renderer.prototype.drawWebGlStaticGeometry = function (a) {
	var g = this.gl;
	g.enableVertexAttribArray(0);
	g.enableVertexAttribArray(1);
	g.enableVertexAttribArray(2);
	g.enableVertexAttribArray(3);
	g.bindBuffer(g.ARRAY_BUFFER, a.positionBuffer);
	g.vertexAttribPointer(0, 3, g.FLOAT, false, 0, 0);
	g.bindBuffer(g.ARRAY_BUFFER, a.texcoordsBuffer);
	g.vertexAttribPointer(1, 2, g.FLOAT, false, 0, 0);
	g.bindBuffer(g.ARRAY_BUFFER, a.texcoordsBuffer2);
	g.vertexAttribPointer(2, 2, g.FLOAT, false, 0, 0);
	g.bindBuffer(g.ARRAY_BUFFER, a.normalBuffer);
	g.vertexAttribPointer(3, 3, g.FLOAT, false, 0, 0);
	g.bindBuffer(g.ELEMENT_ARRAY_BUFFER, a.indexBuffer);
	var d = new CL3D.Matrix4(false);
	this.Projection.copyTo(d);
	d = d.multiply(this.View);
	d = d.multiply(this.World);
	var c = this.currentGLProgram;
	if (c.locWorldViewProj != null) {
		g.uniformMatrix4fv(c.locWorldViewProj, false, this.getMatrixAsWebGLFloatArray(d));
	}
	if (c.locNormalMatrix != null) {
		var e = new CL3D.Matrix4(true);
		e = e.multiply(this.View);
		e = e.multiply(this.World);
		e.makeInverse();
		e.makeTranspose();
		g.uniformMatrix4fv(c.locNormalMatrix, false, this.getMatrixAsWebGLFloatArray(e));
	}
	if (c.locModelViewMatrix != null) {
		var f = new CL3D.Matrix4(true);
		f = f.multiply(this.View);
		f = f.multiply(this.World);
		g.uniformMatrix4fv(c.locModelViewMatrix, false, this.getMatrixAsWebGLFloatArray(f));
	}
	g.drawElements(a.drawMode, a.indexCount, g.UNSIGNED_SHORT, 0);
};
CL3D.Renderer.prototype.draw3DLine = function (b, a) {};
CL3D.Renderer.prototype.draw2DRectangle = function (k, h, a, p, b, e) {
	if (a <= 0 || p <= 0 || this.width == 0 || this.height == 0) {
		return;
	}
	var n = true;
	if (e == null || e == false) {
		n = false;
	}
	var d = this.gl;
	d.enableVertexAttribArray(0);
	d.disableVertexAttribArray(1);
	d.disableVertexAttribArray(2);
	d.disableVertexAttribArray(3);
	h = this.height - h;
	var o = 2 / this.width;
	var m = 2 / this.height;
	k = (k * o) - 1;
	h = (h * m) - 1;
	a *= o;
	p *= m;
	var g = new WebGLFloatArray(4 * 3);
	g[0] = k;
	g[1] = h;
	g[2] = 0;
	g[3] = k + a;
	g[4] = h;
	g[5] = 0;
	g[6] = k + a;
	g[7] = h - p;
	g[8] = 0;
	g[9] = k;
	g[10] = h - p;
	g[11] = 0;
	var j = 6;
	var l = new WebGLUnsignedShortArray(j);
	l[0] = 0;
	l[1] = 2;
	l[2] = 1;
	l[3] = 0;
	l[4] = 3;
	l[5] = 2;
	var f = d.createBuffer();
	d.bindBuffer(d.ARRAY_BUFFER, f);
	d.bufferData(d.ARRAY_BUFFER, g, d.STATIC_DRAW);
	d.vertexAttribPointer(0, 3, d.FLOAT, false, 0, 0);
	var c = d.createBuffer();
	d.bindBuffer(d.ELEMENT_ARRAY_BUFFER, c);
	d.bufferData(d.ELEMENT_ARRAY_BUFFER, l, d.STATIC_DRAW);
	this.currentGLProgram = this.Program2DDrawingColorOnly;
	d.useProgram(this.currentGLProgram);
	d.uniform4f(d.getUniformLocation(this.currentGLProgram, "vColor"), CL3D.getRed(b) / 255, CL3D.getGreen(b) / 255, CL3D.getBlue(b) / 255, n ? (CL3D.getAlpha(b) / 255) : 1);
	d.depthMask(false);
	d.disable(d.DEPTH_TEST);
	if (!n) {
		d.disable(d.BLEND);
	} else {
		d.enable(d.BLEND);
		d.blendFunc(d.SRC_ALPHA, d.ONE_MINUS_SRC_ALPHA);
	}
	d.drawElements(d.TRIANGLES, j, d.UNSIGNED_SHORT, 0);
	d.deleteBuffer(f);
	d.deleteBuffer(c);
};
CL3D.Renderer.prototype.draw2DImage = function (h, g, m, l, t, o, u, k, d) {
	if (t == null || t.isLoaded() == false || m <= 0 || l <= 0 || this.width == 0 || this.height == 0) {
		return;
	}
	if (k == null) {
		k = 1;
	}
	if (d == null) {
		d = 1;
	}
	var f = true;
	if (o == null || o == false) {
		f = false;
	}
	var p = this.gl;
	p.enableVertexAttribArray(0);
	p.enableVertexAttribArray(1);
	p.disableVertexAttribArray(2);
	p.disableVertexAttribArray(3);
	g = this.height - g;
	var e = 2 / this.width;
	var s = 2 / this.height;
	h = (h * e) - 1;
	g = (g * s) - 1;
	m *= e;
	l *= s;
	var q = new WebGLFloatArray(4 * 3);
	q[0] = h;
	q[1] = g;
	q[2] = 0;
	q[3] = h + m;
	q[4] = g;
	q[5] = 0;
	q[6] = h + m;
	q[7] = g - l;
	q[8] = 0;
	q[9] = h;
	q[10] = g - l;
	q[11] = 0;
	var j = new WebGLFloatArray(4 * 2);
	j[0] = 0;
	j[1] = 0;
	j[2] = k;
	j[3] = 0;
	j[4] = k;
	j[5] = d;
	j[6] = 0;
	j[7] = d;
	var a = 6;
	var b = new WebGLUnsignedShortArray(a);
	b[0] = 0;
	b[1] = 2;
	b[2] = 1;
	b[3] = 0;
	b[4] = 3;
	b[5] = 2;
	var n = p.createBuffer();
	p.bindBuffer(p.ARRAY_BUFFER, n);
	p.bufferData(p.ARRAY_BUFFER, q, p.STATIC_DRAW);
	p.vertexAttribPointer(0, 3, p.FLOAT, false, 0, 0);
	var r = p.createBuffer();
	p.bindBuffer(p.ARRAY_BUFFER, r);
	p.bufferData(p.ARRAY_BUFFER, j, p.STATIC_DRAW);
	p.vertexAttribPointer(1, 2, p.FLOAT, false, 0, 0);
	var c = p.createBuffer();
	p.bindBuffer(p.ELEMENT_ARRAY_BUFFER, c);
	p.bufferData(p.ELEMENT_ARRAY_BUFFER, b, p.STATIC_DRAW);
	if (u == null) {
		this.currentGLProgram = this.Program2DDrawingTextureOnly;
	} else {
		this.currentGLProgram = u;
	}
	p.useProgram(this.currentGLProgram);
	p.depthMask(false);
	p.disable(p.DEPTH_TEST);
	if (!f) {
		p.disable(p.BLEND);
	} else {
		p.enable(p.BLEND);
		p.blendFunc(p.SRC_ALPHA, p.ONE_MINUS_SRC_ALPHA);
	}
	p.activeTexture(p.TEXTURE0);
	p.bindTexture(p.TEXTURE_2D, t.getWebGLTexture());
	p.texParameteri(p.TEXTURE_2D, p.TEXTURE_WRAP_S, p.CLAMP_TO_EDGE);
	p.texParameteri(p.TEXTURE_2D, p.TEXTURE_WRAP_T, p.CLAMP_TO_EDGE);
	p.activeTexture(p.TEXTURE1);
	p.bindTexture(p.TEXTURE_2D, null);
	p.drawElements(p.TRIANGLES, a, p.UNSIGNED_SHORT, 0);
	p.deleteBuffer(r);
	p.deleteBuffer(n);
	p.deleteBuffer(c);
};
CL3D.Renderer.prototype.draw2DFontImage = function (b, h, e, a, d, c) {
	if (d == null || d.isLoaded() == false || e <= 0 || a <= 0 || this.width == 0 || this.height == 0) {
		return;
	}
	var g = true;
	var f = this.gl;
	this.currentGLProgram = this.Program2DDrawingCanvasFontColor;
	f.useProgram(this.currentGLProgram);
	f.uniform4f(f.getUniformLocation(this.currentGLProgram, "vColor"), CL3D.getRed(c) / 255, CL3D.getGreen(c) / 255, CL3D.getBlue(c) / 255, g ? (CL3D.getAlpha(c) / 255) : 1);
	this.draw2DImage(b, h, e, a, d, g, this.Program2DDrawingCanvasFontColor, d.OriginalWidth / d.CachedWidth, d.OriginalHeight / d.CachedHeight);
};
CL3D.Renderer.prototype.beginScene = function (a) {
	if (this.gl == null) {
		return;
	}
	this.ensuresizeok();
	var b = this.gl;
	b.depthMask(true);
	b.clearColor(CL3D.getRed(a) / 255, CL3D.getGreen(a) / 255, CL3D.getBlue(a) / 255, CL3D.getAlpha(a) / 255);
	b.clear(b.COLOR_BUFFER_BIT | b.DEPTH_BUFFER_BIT);
};
CL3D.Renderer.prototype.endScene = function () {
	if (this.gl == null) {
		return;
	}
	var a = this.gl;
	a.flush();
};
CL3D.Renderer.prototype.clearDynamicLights = function () {};
CL3D.Renderer.prototype.ensuresizeok = function () {
	if (this.canvas == null || this.gl == null) {
		return;
	}
	if (this.width == this.canvas.width && this.height == this.canvas.height) {
		return;
	}
	this.width = this.canvas.width;
	this.height = this.canvas.height;
	var a = this.gl;
	if (a.viewport) {
		a.viewport(0, 0, this.width, this.height);
	}
};
CL3D.Renderer.prototype.init = function (a, parameters) {
	this.canvas = a;
	this.gl = null;
	try {
		var d = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d", "3d"];
		for (var b = 0; b < d.length; b++) {
			try {
				this.gl = this.canvas.getContext(d[b], parameters);
				if (this.gl != null) {
					break;
				}
			} catch (c) {}
		};
	} catch (c) {}
	if (this.gl == null) {
		CL3D.gCCDebugOutput.printError("Error: This browser does not support WebGL (or it is disabled).");
		CL3D.gCCDebugOutput.printError("See www.ambiera.com / copperlicht / browsersupport.html for details.");
		return false;
	} else {
		this.removeCompatibilityProblems();
		this.ensureCorrectMethodNamesSetForClosure();
		this.initWebGL();
		this.ensuresizeok();
	}
	return true;
};
CL3D.Renderer.prototype.removeCompatibilityProblems = function () {
	if (typeof WebGLFloatArray == "undefined" && typeof Float32Array != "undefined") {
		try {
			WebGLFloatArray = Float32Array;
			WebGLUnsignedShortArray = Uint16Array;
		} catch (a) {
			CL3D.gCCDebugOutput.printError("Error: Float32 array types for webgl not found.");
		}
	}
	if (typeof WebGLFloatArray == "undefined" && typeof CanvasFloatArray != "undefined") {
		try {
			WebGLFloatArray = CanvasFloatArray;
			WebGLUnsignedShortArray = CanvasUnsignedShortArray;
		} catch (a) {
			CL3D.gCCDebugOutput.printError("Error: canvas array types for webgl not found.");
		}
	}
	var b = this.gl;
	if (!b.getProgramParameter) {
		b.getProgramParameter = b.getProgrami;
	}
	if (!b.getShaderParameter) {
		b.getShaderParameter = b.getShaderi;
	}
};
CL3D.Renderer.prototype.loadShader = function (d, e) {
	var c = this.gl;
	var a = c.createShader(d);
	if (a == null) {
		return null;
	}
	c.shaderSource(a, e);
	c.compileShader(a);
	if (!c.getShaderParameter(a, c.COMPILE_STATUS)) {
		var b = (d == c.VERTEX_SHADER) ? "vertex" : "fragment";
		CL3D.gCCDebugOutput.printError("Error loading " + b + " shader: " + c.getShaderInfoLog(a));
		return null;
	}
	return a;
};
CL3D.Renderer.prototype.createShaderProgram = function (d, c) {
	var f = this.gl;
	var e = this.loadShader(f.VERTEX_SHADER, d);
	var a = this.loadShader(f.FRAGMENT_SHADER, c);
	if (!e || !a) {
		CL3D.gCCDebugOutput.print("Could not create shader program");
		return null;
	}
	var b = f.createProgram();
	f.attachShader(b, e);
	f.attachShader(b, a);
	f.bindAttribLocation(b, 0, "vPosition");
	f.bindAttribLocation(b, 1, "vTexCoord1");
	f.bindAttribLocation(b, 2, "vTexCoord2");
	f.bindAttribLocation(b, 3, "vNormal");
	f.linkProgram(b);
	if (!f.getProgramParameter(b, f.LINK_STATUS)) {
		CL3D.gCCDebugOutput.print("Could not link program:" + f.getProgramInfoLog(b));
	} else {
		f.useProgram(b);
		f.uniform1i(f.getUniformLocation(b, "texture1"), 0);
		f.uniform1i(f.getUniformLocation(b, "texture2"), 1);
	}
	return b;
};
CL3D.Renderer.prototype.createMaterialType = function (c, b, f, d, e) {
	var a = this.createMaterialTypeInternal(c, b, f, d, e);
	if (!a) {
		return -1;
	}
	this.MinExternalMaterialTypeId += 1;
	this.MaterialPrograms[this.MinExternalMaterialTypeId] = a;
	return this.MinExternalMaterialTypeId;
};
CL3D.Renderer.prototype.getGLProgramFromMaterialType = function (a) {
	var b = null;
	try {
		b = this.MaterialPrograms[a];
	} catch (c) {}
	return b;
};
CL3D.Renderer.prototype.createMaterialTypeInternal = function (a, d, g, c, e) {
	var b = this.createShaderProgram(a, d);
	if (b) {
		b.blendenabled = g ? g : false;
		b.blendsfactor = c;
		b.blenddfactor = e;
		var f = this.gl;
		b.locWorldViewProj = f.getUniformLocation(b, "worldviewproj");
		b.locNormalMatrix = f.getUniformLocation(b, "normaltransform");
		b.locModelViewMatrix = f.getUniformLocation(b, "modelviewtransform");
	}
	return b;
};
CL3D.Renderer.prototype.initWebGL = function () {
	var h = this.gl;
	var p = this.createMaterialTypeInternal(this.vs_shader_normaltransform, this.fs_shader_onlyfirsttexture);
	var e = this.createMaterialTypeInternal(this.vs_shader_normaltransform, this.fs_shader_lightmapcombine);
	var l = this.createMaterialTypeInternal(this.vs_shader_normaltransform, this.fs_shader_lightmapcombine_m4);
	var d = this.createMaterialTypeInternal(this.vs_shader_normaltransform, this.fs_shader_onlyfirsttexture, true, h.SRC_ALPHA, h.ONE_MINUS_SRC_ALPHA);
	var m = this.createMaterialTypeInternal(this.vs_shader_normaltransform, this.fs_shader_onlyfirsttexture, true, h.ONE, h.ONE_MINUS_SRC_COLOR);
	var f = this.createMaterialTypeInternal(this.vs_shader_reflectiontransform, this.fs_shader_lightmapcombine);
	var k = this.createMaterialTypeInternal(this.vs_shader_reflectiontransform, this.fs_shader_lightmapcombine, true, h.SRC_ALPHA, h.ONE_MINUS_SRC_ALPHA);
	this.Program2DDrawingColorOnly = this.createMaterialTypeInternal(this.vs_shader_2ddrawing_coloronly, this.fs_shader_simplecolor);
	this.Program2DDrawingTextureOnly = this.createMaterialTypeInternal(this.vs_shader_2ddrawing_texture, this.fs_shader_onlyfirsttexture);
	this.Program2DDrawingCanvasFontColor = this.createMaterialTypeInternal(this.vs_shader_2ddrawing_texture, this.fs_shader_2ddrawing_canvasfont);
	this.MaterialPrograms[CL3D.Material.EMT_SOLID] = p;
	this.MaterialPrograms[CL3D.Material.EMT_SOLID + 1] = p;
	this.MaterialPrograms[CL3D.Material.EMT_LIGHTMAP] = e;
	this.MaterialPrograms[CL3D.Material.EMT_LIGHTMAP + 1] = e;
	this.MaterialPrograms[CL3D.Material.EMT_LIGHTMAP + 2] = e;
	this.MaterialPrograms[CL3D.Material.EMT_LIGHTMAP + 3] = l;
	this.MaterialPrograms[CL3D.Material.EMT_TRANSPARENT_ADD_COLOR] = m;
	this.MaterialPrograms[CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL] = d;
	this.MaterialPrograms[CL3D.Material.EMT_REFLECTION_2_LAYER] = f;
	this.MaterialPrograms[CL3D.Material.EMT_TRANSPARENT_REFLECTION_2_LAYER] = k;
	h.useProgram(p);
	this.currentGLProgram = p;
	var c = 0;
	var j = 0;
	var n = 1;
	var o = 1;
	h.clearColor(c, j, n, o);
	h.clearDepth(10000);
	h.depthMask(true);
	h.enable(h.DEPTH_TEST);
	h.disable(h.BLEND);
	h.blendFunc(h.SRC_ALPHA, h.ONE_MINUS_SRC_ALPHA);
	h.enable(h.CULL_FACE);
	h.cullFace(h.BACK);
};
CL3D.Renderer.prototype.setProjection = function (a) {
	a.copyTo(this.Projection);
};
CL3D.Renderer.prototype.getProjection = function () {
	return this.Projection;
};
CL3D.Renderer.prototype.setView = function (a) {
	a.copyTo(this.View);
};
CL3D.Renderer.prototype.getView = function () {
	return this.View;
};
CL3D.Renderer.prototype.getWorld = function () {
	return this.World;
};
CL3D.Renderer.prototype.setWorld = function (a) {
	if (a) {
		a.copyTo(this.World);
	}
};
CL3D.Renderer.prototype.ensureCorrectMethodNamesSetForClosure = function (a) {};
CL3D.Renderer.prototype.getMatrixAsWebGLFloatArray = function (a) {
	return new WebGLFloatArray(a.asArray());
};
CL3D.Renderer.prototype.deleteTexture = function (a) {
	if (a == null) {
		return;
	}
	var b = this.gl;
	b.deleteTexture(a.getWebGLTexture());
	a.Texture = null;
	a.Loaded = false;
};
CL3D.Renderer.prototype.createTextureFrom2DCanvas = function (b, h) {
	var c = this.gl;
	var g = c.createTexture();
	c.bindTexture(c.TEXTURE_2D, g);
	var a = b.width;
	var l = b.height;
	var e = a;
	var f = l;
	if (!this.isPowerOfTwo(b.width) || !this.isPowerOfTwo(b.height)) {
		var d = document.createElement("canvas");
		d.width = this.nextHighestPowerOfTwo(b.width);
		d.height = this.nextHighestPowerOfTwo(b.height);
		var j = d.getContext("2d");
		if (h) {
			j.drawImage(b, 0, 0, b.width, b.height, 0, 0, b.width, b.height);
		} else {
			j.drawImage(b, 0, 0, b.width, b.height, 0, 0, d.width, d.height);
		}
		b = d;
		e = d.width;
		f = d.height;
	}
	this.fillTextureFromDOMObject(g, b);
	c.texParameteri(c.TEXTURE_2D, c.TEXTURE_MAG_FILTER, c.LINEAR);
	c.texParameteri(c.TEXTURE_2D, c.TEXTURE_MIN_FILTER, c.LINEAR_MIPMAP_NEAREST);
	c.generateMipmap(c.TEXTURE_2D);
	c.bindTexture(c.TEXTURE_2D, null);
	var k = new CL3D.Texture();
	k.Name = "";
	k.Texture = g;
	k.Image = null;
	k.Loaded = true;
	k.CachedWidth = e;
	k.CachedHeight = f;
	k.OriginalWidth = a;
	k.OriginalHeight = l;
	return k;
};
CL3D.Renderer.prototype.isPowerOfTwo = function (a) {
	return (a & (a - 1)) == 0;
};
CL3D.Renderer.prototype.nextHighestPowerOfTwo = function (a) {
	--a;
	for (var b = 1; b < 32; b <<= 1) {
		a = a | a >> b;
	}
	return a + 1;
};
CL3D.Renderer.prototype.fillTextureFromDOMObject = function (a, b) {
	var d = this.gl;
	try {
		d.texImage2D(d.TEXTURE_2D, 0, d.RGBA, d.RGBA, d.UNSIGNED_BYTE, b);
	} catch (c) {
		d.texImage2D(d.TEXTURE_2D, 0, b);
	}
};
CL3D.Renderer.prototype.finalizeLoadedImageTexture = function (b) {
	var f = this.gl;
	var c = f.createTexture();
	var e = b.Image;
	if (!this.isPowerOfTwo(e.width) || !this.isPowerOfTwo(e.height)) {
		var a = document.createElement("canvas");
		if (a != null) {
			a.width = this.nextHighestPowerOfTwo(e.width);
			a.height = this.nextHighestPowerOfTwo(e.height);
			var d = a.getContext("2d");
			d.drawImage(e, 0, 0, e.width, e.height, 0, 0, a.width, a.height);
			e = a;
		}
	}
	f.bindTexture(f.TEXTURE_2D, c);
	this.fillTextureFromDOMObject(c, e);
	f.generateMipmap(f.TEXTURE_2D);
	f.texParameteri(f.TEXTURE_2D, f.TEXTURE_MAG_FILTER, f.LINEAR);
	f.texParameteri(f.TEXTURE_2D, f.TEXTURE_MIN_FILTER, f.LINEAR_MIPMAP_NEAREST);
	f.bindTexture(f.TEXTURE_2D, null);
	this.textureWasLoadedFlag = true;
	b.Texture = c;
};
CL3D.Renderer.prototype.vs_shader_2ddrawing_coloronly = "				#ifdef GL_ES												\n	precision highp float;										\n	#endif														\n																	attribute vec4 vPosition;																									    void main()													    {															        gl_Position = vPosition;								    }																";
CL3D.Renderer.prototype.vs_shader_2ddrawing_texture = "					#ifdef GL_ES												\n	precision highp float;										\n	#endif														\n																	attribute vec4 vPosition;										attribute vec4 vTexCoord1;										varying vec2 v_texCoord1;																									    void main()													    {															        gl_Position = vPosition;										v_texCoord1 = vTexCoord1.st;							    }																";
CL3D.Renderer.prototype.fs_shader_simplecolor = "						#ifdef GL_ES												\n	precision highp float;										\n	#endif														\n	uniform vec4 vColor;																										    void main()													    {															         gl_FragColor = vColor;									    }																";
CL3D.Renderer.prototype.fs_shader_2ddrawing_canvasfont = "				#ifdef GL_ES												\n	precision highp float;										\n	#endif														\n	uniform vec4 vColor;											uniform sampler2D texture1;										uniform sampler2D texture2;																									    varying vec2 v_texCoord1;																									    void main()													    {																    vec2 texCoord = vec2(v_texCoord1.s, v_texCoord1.t);		        float alpha = texture2D(texture1, texCoord).r;		        gl_FragColor = vec4(vColor.rgb, alpha);						    }																";
CL3D.Renderer.prototype.vs_shader_normaltransform = "					#ifdef GL_ES												\n	precision highp float;										\n	#endif														\n	uniform mat4 worldviewproj;																										attribute vec4 vPosition;									    attribute vec4 vNormal;										    attribute vec2 vTexCoord1;										attribute vec2 vTexCoord2;																									    varying vec2 v_texCoord1;										varying vec2 v_texCoord2;																									    void main()													    {															        gl_Position = worldviewproj * vPosition;				        v_texCoord1 = vTexCoord1.st;									v_texCoord2 = vTexCoord2.st;							    }																";
CL3D.Renderer.prototype.vs_shader_reflectiontransform = "			#ifdef GL_ES												\n	precision highp float;										\n	#endif														\n	uniform mat4 worldviewproj;									\n	uniform mat4 normaltransform;								\n	uniform mat4 modelviewtransform;							\n																	attribute vec4 vPosition;									    attribute vec3 vNormal;										    attribute vec2 vTexCoord1;										attribute vec2 vTexCoord2;																									    varying vec2 v_texCoord1;										varying vec2 v_texCoord2;																									    void main()													    {															        gl_Position = worldviewproj * vPosition;					\n																	\n		//	use reflection											\n		vec4 pos = modelviewtransform * vPosition;					\n		vec4 n = normalize(normaltransform * vec4(vNormal, 1));		\n		//n = vec4(-n.x, n.z, n.y, 1.0);								\n		vec3 r = reflect( pos.xyz, n.xyz );							\n		float m = sqrt( r.x * r.x + r.y * r.y + (r.z+1.0) * (r.z+1.0) ); \n															\n		//	texture coordinates								\n		v_texCoord1 = vTexCoord1.st;						\n		v_texCoord2.x = r.x / m  + 0.5;						\n		v_texCoord2.y = r.y / m  + 0.5;						\n    }														\n	";
CL3D.Renderer.prototype.fs_shader_onlyfirsttexture = "					#ifdef GL_ES												\n	precision highp float;										\n	#endif														\n	uniform sampler2D texture1;										uniform sampler2D texture2;																									    varying vec2 v_texCoord1;										varying vec2 v_texCoord2;																									    void main()													    {															        vec2 texCoord = vec2(v_texCoord1.s, v_texCoord1.t);		        gl_FragColor = texture2D(texture1, texCoord);			    }																";
CL3D.Renderer.prototype.fs_shader_lightmapcombine = "					#ifdef GL_ES												\n	precision highp float;										\n	#endif														\n	uniform sampler2D texture1;										uniform sampler2D texture2;																									    varying vec2 v_texCoord1;										varying vec2 v_texCoord2;																									    void main()													    {															        vec2 texCoord1 = vec2(v_texCoord1.s, v_texCoord1.t);			vec2 texCoord2 = vec2(v_texCoord2.s, v_texCoord2.t);	        vec4 col1 = texture2D(texture1, texCoord1);						vec4 col2 = texture2D(texture2, texCoord2);						gl_FragColor = col1 * col2;								    }																";
CL3D.Renderer.prototype.fs_shader_lightmapcombine_m4 = "			#ifdef GL_ES												\n	precision highp float;										\n	#endif														\n	uniform sampler2D texture1;										uniform sampler2D texture2;																									    varying vec2 v_texCoord1;										varying vec2 v_texCoord2;																									    void main()													    {															        vec2 texCoord1 = vec2(v_texCoord1.s, v_texCoord1.t);			vec2 texCoord2 = vec2(v_texCoord2.s, v_texCoord2.t);	        vec4 col1 = texture2D(texture1, texCoord1);						vec4 col2 = texture2D(texture2, texCoord2);						gl_FragColor = col1 * col2 * 3.0;						    }																";
CL3D.SceneNode = function () {
	this.Type = -1;
	this.Pos = new CL3D.Vect3d();
	this.Rot = new CL3D.Vect3d();
	this.Scale = new CL3D.Vect3d(1, 1, 1);
	this.Visible = true;
	this.Name = "";
	this.Culling = 0;
	this.Id = -1;
	this.Parent = null;
	this.Children = new Array();
	this.Animators = new Array();
	this.AbsoluteTransformation = new CL3D.Matrix4();
	this.scene = null;
	this.Selector = null;
};
CL3D.SceneNode.prototype.init = function () {
	this.Pos = new CL3D.Vect3d();
	this.Rot = new CL3D.Vect3d();
	this.Scale = new CL3D.Vect3d(1, 1, 1);
	this.Children = new Array();
	this.Animators = new Array();
	this.AbsoluteTransformation = new CL3D.Matrix4();
};
CL3D.SceneNode.prototype.Pos = null;
CL3D.SceneNode.prototype.Rot = null;
CL3D.SceneNode.prototype.Scale = null;
CL3D.SceneNode.prototype.Visible = true;
CL3D.SceneNode.prototype.Name = "";
CL3D.SceneNode.prototype.Id = -1;
CL3D.SceneNode.prototype.Selector = null;
CL3D.SceneNode.prototype.Parent = null;
CL3D.SceneNode.prototype.getParent = function () {
	return this.Parent;
};
CL3D.SceneNode.prototype.getType = function () {
	return "none";
};
CL3D.SceneNode.prototype.getBoundingBox = function () {
	return new CL3D.Box3d();
};
CL3D.SceneNode.prototype.getAnimators = function () {
	return this.Animators;
};
CL3D.SceneNode.prototype.getAnimatorOfType = function (b) {
	for (i = 0; i < this.Animators.length; ++i) {
		var a = this.Animators[i];
		if (a.getType() == b) {
			return a;
		}
	}
	return null;
};
CL3D.SceneNode.prototype.getTransformedBoundingBox = function () {
	var a = this.getBoundingBox().clone();
	this.AbsoluteTransformation.transformBoxEx(a);
	return a;
};
CL3D.SceneNode.prototype.cloneMembers = function (a, e) {
	a.Name = new String(this.Name);
	a.Visible = this.Visible;
	a.Culling = this.Culling;
	a.Pos = this.Pos.clone();
	a.Rot = this.Rot.clone();
	a.Scale = this.Scale.clone();
	a.Type = this.Type;
	if (e) {
		e.addChild(a);
	}
	for (var d = 0; d < this.Children.lenght; ++d) {
		var g = this.Children[d];
		if (g) {
			var f = g.createClone(a);
			if (f != null) {
				a.addChild(f);
			}
		};
	}
	a.Animators = this.Animators.slice();
	if (this.AbsoluteTransformation) {
		a.AbsoluteTransformation = this.AbsoluteTransformation.clone();
	}
	a.scene = this.scene;
};
CL3D.SceneNode.prototype.createClone = function (a) {
	return null;
};
CL3D.SceneNode.prototype.addAnimator = function (b) {
	if (b != null) {
		this.Animators.push(b);
	}
};
CL3D.SceneNode.prototype.removeAnimator = function (b) {
	if (b == null) {
		return;
	}
	var d;
	for (d = 0; d < this.Animators.length; ++d) {
		var c = this.Animators[d];
		if (c === b) {
			this.Animators.splice(d, 1);
			return;
		}
	};
};
CL3D.SceneNode.prototype.addChild = function (a) {
	if (a) {
		a.scene = this.scene;
		if (a.Parent) {
			a.Parent.removeChild(a);
		}
		a.Parent = this;
		this.Children.push(a);
	}
};
CL3D.SceneNode.prototype.removeChild = function (b) {
	for (var a = 0; a < this.Children.length; ++a) {
		if (this.Children[a] === b) {
			b.Parent = null;
			this.Children.splice(a, 1);
			return;
		}
	};
};
CL3D.SceneNode.prototype.OnRegisterSceneNode = function (b) {
	if (this.Visible) {
		for (var a = 0; a < this.Children.length; ++a) {
			var d = this.Children[a];
			d.OnRegisterSceneNode(b);
		}
	};
};
CL3D.SceneNode.prototype.OnAnimate = function (h, k) {
	var e = false;
	if (this.Visible) {
		var f;
		var b = this.Animators.length;
		for (f = 0; f < b;) {
			var d = this.Animators[f];
			e = d.animateNode(this, k) || e;
			var g = b;
			b = this.Animators.length;
			if (g >= b) {
				++f;
			}
		}
		this.updateAbsolutePosition();
		for (f = 0; f < this.Children.length; ++f) {
			var j = this.Children[f];
			e = j.OnAnimate(h, k) || e;
		}
	}
	return e;
};
CL3D.SceneNode.prototype.getRelativeTransformation = function () {
	var b = new CL3D.Matrix4();
	b.setRotationDegrees(this.Rot);
	b.setTranslation(this.Pos);
	if (this.Scale.X != 1 || this.Scale.Y != 1 || this.Scale.Z != 1) {
		var a = new CL3D.Matrix4();
		a.setScale(this.Scale);
		b = b.multiply(a);
	}
	return b;
};
CL3D.SceneNode.prototype.updateAbsolutePosition = function () {
	if (this.Parent != null) {
		this.AbsoluteTransformation = this.Parent.AbsoluteTransformation.multiply(this.getRelativeTransformation());
	} else {
		this.AbsoluteTransformation = this.getRelativeTransformation();
	}
};
CL3D.SceneNode.prototype.render = function (a) {};
CL3D.SceneNode.prototype.getAbsoluteTransformation = function () {
	return this.AbsoluteTransformation;
};
CL3D.SceneNode.prototype.getAbsolutePosition = function () {
	return this.AbsoluteTransformation.getTranslation();
};
CL3D.SceneNode.prototype.getMaterialCount = function () {
	return 0;
};
CL3D.SceneNode.prototype.getMaterial = function (a) {
	return null;
};
CL3D.CameraSceneNode = function () {
	this.init();
	this.Box = new CL3D.Box3d();
	this.DoesCollision = false;
	this.Active = false;
	this.Target = new CL3D.Vect3d(0, 0, 10);
	this.UpVector = new CL3D.Vect3d(0, 1, 0);
	this.Projection = new CL3D.Matrix4();
	this.ViewMatrix = new CL3D.Matrix4();
	this.Fovy = CL3D.PI / 2.5;
	this.Aspect = 4 / 3;
	this.ZNear = 0.1;
	this.ZFar = 3000;
	this.Projection.buildProjectionMatrixPerspectiveFovLH(this.Fovy, this.Aspect, this.ZNear, this.ZFar);
};
CL3D.CameraSceneNode.prototype = new CL3D.SceneNode();
CL3D.CameraSceneNode.prototype.recalculateProjectionMatrix = function () {
	this.Projection.buildProjectionMatrixPerspectiveFovLH(this.Fovy, this.Aspect, this.ZNear, this.ZFar);
};
CL3D.CameraSceneNode.prototype.getType = function () {
	return "camera";
};
CL3D.CameraSceneNode.prototype.setAspectRatio = function (b) {
	if (!CL3D.equals(this.Aspect, b)) {
		this.Aspect = b;
		this.recalculateProjectionMatrix();
	}
};
CL3D.CameraSceneNode.prototype.getAspectRatio = function () {
	return this.Aspect;
};
CL3D.CameraSceneNode.prototype.getFov = function () {
	return this.Fovy;
};
CL3D.CameraSceneNode.prototype.setFov = function (a) {
	if (!CL3D.equals(this.Fovy, a)) {
		this.Fovy = a;
		this.recalculateProjectionMatrix();
	}
};
CL3D.CameraSceneNode.prototype.setTarget = function (a) {
	if (a) {
		this.Target = a.clone();
	}
};
CL3D.CameraSceneNode.prototype.getTarget = function () {
	return this.Target;
};
CL3D.CameraSceneNode.prototype.getUpVector = function () {
	return this.UpVector;
};
CL3D.CameraSceneNode.prototype.setUpVector = function (a) {
	if (a) {
		this.UpVector = a.clone();
	}
};
CL3D.CameraSceneNode.prototype.getNearValue = function () {
	return this.ZNear;
};
CL3D.CameraSceneNode.prototype.setNearValue = function (a) {
	if (!CL3D.equals(this.ZNear, a)) {
		this.ZNear = a;
		this.recalculateProjectionMatrix();
	}
};
CL3D.CameraSceneNode.prototype.getFarValue = function () {
	return this.ZFar;
};
CL3D.CameraSceneNode.prototype.setFarValue = function (a) {
	if (!CL3D.equals(this.ZFar, a)) {
		this.ZFar = a;
		this.recalculateProjectionMatrix();
	}
};
CL3D.CameraSceneNode.prototype.recalculateViewArea = function () {};
CL3D.CameraSceneNode.prototype.OnAnimate = function (b, c) {
	var a = CL3D.SceneNode.prototype.OnAnimate.call(this, b, c);
	this.calculateViewMatrix();
	return a;
};
CL3D.CameraSceneNode.prototype.calculateViewMatrix = function () {
	var b = this.getAbsolutePosition();
	var a = this.Target.clone();
	if (b.equals(a)) {
		a.X += 1;
	}
	this.ViewMatrix.buildCameraLookAtMatrixLH(this.Pos, a, this.UpVector);
	this.recalculateViewArea();
};
CL3D.CameraSceneNode.prototype.OnRegisterSceneNode = function (a) {
	if (a.getActiveCamera() === this) {
		a.registerNodeForRendering(this, 2);
		CL3D.SceneNode.prototype.OnRegisterSceneNode.call(this, a);
	}
};
CL3D.CameraSceneNode.prototype.render = function (a) {
	this.calculateViewMatrix();
	if (this.Aspect == 0) {
		this.setAutoAspectIfNoFixedSet(a.width, a.height);
		if (this.Aspect == 0) {
			this.setAspectRatio(3 / 4);
		}
	}
	a.setProjection(this.Projection);
	a.setView(this.ViewMatrix);
};
CL3D.CameraSceneNode.prototype.onMouseDown = function (b) {
	for (var a = 0; a < this.Animators.length; ++a) {
		this.Animators[a].onMouseDown(b);
	}
};
CL3D.CameraSceneNode.prototype.onMouseWheel = function (b) {
	for (var a = 0; a < this.Animators.length; ++a) {
		this.Animators[a].onMouseWheel(b);
	}
};
CL3D.CameraSceneNode.prototype.onMouseUp = function (b) {
	for (var a = 0; a < this.Animators.length; ++a) {
		this.Animators[a].onMouseUp(b);
	}
};
CL3D.CameraSceneNode.prototype.onMouseMove = function (b) {
	for (var a = 0; a < this.Animators.length; ++a) {
		this.Animators[a].onMouseMove(b);
	}
};
CL3D.CameraSceneNode.prototype.onKeyDown = function (b) {
	for (var a = 0; a < this.Animators.length; ++a) {
		this.Animators[a].onKeyDown(b);
	}
};
CL3D.CameraSceneNode.prototype.onKeyUp = function (b) {
	for (var a = 0; a < this.Animators.length; ++a) {
		this.Animators[a].onKeyUp(b);
	}
};
CL3D.CameraSceneNode.prototype.createClone = function (a) {
	var b = new CL3D.CameraSceneNode();
	cloneMembers(b, a);
	if (Target) {
		b.Target = this.Target.clone();
	}
	if (UpVector) {
		b.UpVector = this.UpVector.clone();
	}
	if (Projection) {
		b.Projection = this.Projection.clone();
	}
	if (ViewMatrix) {
		b.ViewMatrix = this.ViewMatrix.clone();
	}
	b.Fovy = this.Fovy;
	b.Aspect = this.Aspect;
	b.ZNear = this.ZNear;
	b.ZFar = this.ZFar;
	if (Box) {
		b.Box = this.Box.clone();
	}
	return b;
};
CL3D.CameraSceneNode.prototype.setAutoAspectIfNoFixedSet = function (a, d) {
	if (a == 0 || d == 0) {
		return;
	}
	var c = this.Aspect;
	if (!CL3D.equals(c, 0)) {
		return;
	}
	var b = a / d;
	this.setAspectRatio(b);
};
CL3D.MeshSceneNode = function () {
	this.init();
	this.Box = new CL3D.Box3d();
	this.DoesCollision = false;
	this.OwnedMesh = null;
	this.ReadOnlyMaterials = true;
	this.Selector = null;
	this.Visible = true;
};
CL3D.MeshSceneNode.prototype = new CL3D.SceneNode();
CL3D.MeshSceneNode.prototype.getBoundingBox = function () {
	if (this.OwnedMesh) {
		return this.OwnedMesh.Box;
	}
	return this.Box;
};
CL3D.MeshSceneNode.prototype.getMesh = function () {
	return this.OwnedMesh;
};
CL3D.MeshSceneNode.prototype.setMesh = function (a) {
	this.OwnedMesh = a;
};
CL3D.MeshSceneNode.prototype.getType = function () {
	return "mesh";
};
CL3D.MeshSceneNode.prototype.OnRegisterSceneNode = function (d) {
	var f = this.OwnedMesh;
	if (this.Visible && f) {
		var e = false;
		var a = false;
		for (var c = 0; c < f.MeshBuffers.length; ++c) {
			var b = f.MeshBuffers[c];
			if (b.Mat.isTransparent()) {
				e = true;
			} else {
				a = true;
			}
		}
		if (e) {
			d.registerNodeForRendering(this, CL3D.Scene.RENDER_MODE_TRANSPARENT);
		}
		if (a) {
			d.registerNodeForRendering(this, CL3D.Scene.RENDER_MODE_DEFAULT);
		}
		CL3D.SceneNode.prototype.OnRegisterSceneNode.call(this, d);
	}
};
CL3D.MeshSceneNode.prototype.show = function() {
	this.Visible = true;
};
CL3D.MeshSceneNode.prototype.hide = function() {
	this.Visible = false;
};
CL3D.MeshSceneNode.prototype.render = function (a) {
	if (this.Visible) {
		a.setWorld(this.AbsoluteTransformation);
		a.drawMesh(this.OwnedMesh);
	}
};
CL3D.MeshSceneNode.prototype.getMaterialCount = function () {
	if (this.OwnedMesh) {
		return this.OwnedMesh.MeshBuffers.length;
	}
	return 0;
};
CL3D.MeshSceneNode.prototype.getMaterial = function (b) {
	if (this.OwnedMesh != null) {
		if (b >= 0 && b < this.OwnedMesh.MeshBuffers.length) {
			var a = this.OwnedMesh.MeshBuffers[b];
			return a.Mat;
		}
	}
	return null;
};
CL3D.MeshSceneNode.prototype.createClone = function (a) {
	var b = new CL3D.MeshSceneNode();
	this.cloneMembers(b, a);
	b.OwnedMesh = this.OwnedMesh;
	b.ReadonlyMaterials = this.ReadonlyMaterials;
	b.DoesCollision = this.DoesCollision;
	if (this.Box) {
		b.Box = this.Box.clone();
	}
	return b;
};
CL3D.SkyBoxSceneNode = function () {
	this.OwnedMesh = new CL3D.Mesh();
	var a = [0, 1, 2, 0, 2, 3];
	var b = new CL3D.MeshBuffer();
	this.OwnedMesh.AddMeshBuffer(b);
	b.Mat.ClampTexture1 = true;
	b.Indices = a;
	b.Vertices.push(this.createVertex(-1, -1, -1, 0, 0, 1, 1, 1));
	b.Vertices.push(this.createVertex(1, -1, -1, 0, 0, 1, 0, 1));
	b.Vertices.push(this.createVertex(1, 1, -1, 0, 0, 1, 0, 0));
	b.Vertices.push(this.createVertex(-1, 1, -1, 0, 0, 1, 1, 0));
	b = new CL3D.MeshBuffer();
	this.OwnedMesh.AddMeshBuffer(b);
	b.Mat.ClampTexture1 = true;
	b.Indices = a;
	b.Vertices.push(this.createVertex(1, -1, -1, -1, 0, 0, 1, 1));
	b.Vertices.push(this.createVertex(1, -1, 1, -1, 0, 0, 0, 1));
	b.Vertices.push(this.createVertex(1, 1, 1, -1, 0, 0, 0, 0));
	b.Vertices.push(this.createVertex(1, 1, -1, -1, 0, 0, 1, 0));
	b = new CL3D.MeshBuffer();
	this.OwnedMesh.AddMeshBuffer(b);
	b.Mat.ClampTexture1 = true;
	b.Indices = a;
	b.Vertices.push(this.createVertex(-1, -1, 1, 1, 0, 0, 1, 1));
	b.Vertices.push(this.createVertex(-1, -1, -1, 1, 0, 0, 0, 1));
	b.Vertices.push(this.createVertex(-1, 1, -1, 1, 0, 0, 0, 0));
	b.Vertices.push(this.createVertex(-1, 1, 1, 1, 0, 0, 1, 0));
	b = new CL3D.MeshBuffer();
	this.OwnedMesh.AddMeshBuffer(b);
	b.Mat.ClampTexture1 = true;
	b.Indices = a;
	b.Vertices.push(this.createVertex(1, -1, 1, 0, 0, -1, 1, 1));
	b.Vertices.push(this.createVertex(-1, -1, 1, 0, 0, -1, 0, 1));
	b.Vertices.push(this.createVertex(-1, 1, 1, 0, 0, -1, 0, 0));
	b.Vertices.push(this.createVertex(1, 1, 1, 0, 0, -1, 1, 0));
	b = new CL3D.MeshBuffer();
	this.OwnedMesh.AddMeshBuffer(b);
	b.Mat.ClampTexture1 = true;
	b.Indices = a;
	b.Vertices.push(this.createVertex(1, 1, -1, 0, -1, 0, 1, 1));
	b.Vertices.push(this.createVertex(1, 1, 1, 0, -1, 0, 0, 1));
	b.Vertices.push(this.createVertex(-1, 1, 1, 0, -1, 0, 0, 0));
	b.Vertices.push(this.createVertex(-1, 1, -1, 0, -1, 0, 1, 0));
	b = new CL3D.MeshBuffer();
	this.OwnedMesh.AddMeshBuffer(b);
	b.Mat.ClampTexture1 = true;
	b.Indices = a;
	b.Vertices.push(this.createVertex(1, -1, 1, 0, 1, 0, 1, 1));
	b.Vertices.push(this.createVertex(1, -1, -1, 0, 1, 0, 0, 1));
	b.Vertices.push(this.createVertex(-1, -1, -1, 0, 1, 0, 0, 0));
	b.Vertices.push(this.createVertex(-1, -1, 1, 0, 1, 0, 1, 0));
};
CL3D.SkyBoxSceneNode.prototype = new CL3D.MeshSceneNode();
CL3D.SkyBoxSceneNode.prototype.getType = function () {
	return "sky";
};
CL3D.SkyBoxSceneNode.prototype.createVertex = function (g, f, e, d, c, b, j, h) {
	var a = new CL3D.Vertex3D(true);
	a.Pos.X = g;
	a.Pos.Y = f;
	a.Pos.Z = e;
	a.TCoords.X = j;
	a.TCoords.Y = h;
	return a;
};
CL3D.SkyBoxSceneNode.prototype.OnRegisterSceneNode = function (a) {
	if (this.Visible) {
		a.registerNodeForRendering(this, 1);
		CL3D.SceneNode.prototype.OnRegisterSceneNode.call(this, a);
	}
};
CL3D.SkyBoxSceneNode.prototype.render = function (b) {
	var a = this.scene.getActiveCamera();
	if (!a || !this.OwnedMesh) {
		return;
	}
	var d = new CL3D.Matrix4(false);
	this.AbsoluteTransformation.copyTo(d);
	d.setTranslation(a.getAbsolutePosition());
	var e = (a.getNearValue() + a.getFarValue()) * 0.5;
	var c = new CL3D.Matrix4();
	c.setScale(new CL3D.Vect3d(e, e, e));
	b.setWorld(d.multiply(c));
	b.drawMesh(this.OwnedMesh);
};
CL3D.SkyBoxSceneNode.prototype.createClone = function (a) {
	var b = new CL3D.SkyBoxSceneNode();
	this.cloneMembers(b, a);
	if (OwnedMesh) {
		b.OwnedMesh = this.OwnedMesh.clone();
	}
	b.ReadonlyMaterials = this.ReadonlyMaterials;
	b.DoesCollision = this.DoesCollision;
	if (this.Box) {
		b.Box = this.Box.clone();
	}
	return b;
};
CL3D.CubeSceneNode = function (e) {
	if (e == null) {
		e = 10;
	}
	this.OwnedMesh = new CL3D.Mesh();
	var c = new CL3D.MeshBuffer();
	c.Indices = [0, 2, 1, 0, 3, 2, 1, 5, 4, 1, 2, 5, 4, 6, 7, 4, 5, 6, 7, 3, 0, 7, 6, 3, 9, 5, 2, 9, 8, 5, 0, 11, 10, 0, 10, 7];
	this.OwnedMesh.AddMeshBuffer(c);
	var b = CL3D.createColor(255, 255, 255, 255);
	c.Vertices.push(this.createVertex(0, 0, 0, -1, -1, -1, b, 0, 1));
	c.Vertices.push(this.createVertex(1, 0, 0, 1, -1, -1, b, 1, 1));
	c.Vertices.push(this.createVertex(1, 1, 0, 1, 1, -1, b, 1, 0));
	c.Vertices.push(this.createVertex(0, 1, 0, -1, 1, -1, b, 0, 0));
	c.Vertices.push(this.createVertex(1, 0, 1, 1, -1, 1, b, 0, 1));
	c.Vertices.push(this.createVertex(1, 1, 1, 1, 1, 1, b, 0, 0));
	c.Vertices.push(this.createVertex(0, 1, 1, -1, 1, 1, b, 1, 0));
	c.Vertices.push(this.createVertex(0, 0, 1, -1, -1, 1, b, 1, 1));
	c.Vertices.push(this.createVertex(0, 1, 1, -1, 1, 1, b, 0, 1));
	c.Vertices.push(this.createVertex(0, 1, 0, -1, 1, -1, b, 1, 1));
	c.Vertices.push(this.createVertex(1, 0, 1, 1, -1, 1, b, 1, 0));
	c.Vertices.push(this.createVertex(1, 0, 0, 1, -1, -1, b, 0, 0));
	for (var d = 0; d < 12; ++d) {
		var a = c.Vertices[d].Pos;
		a.multiplyThisWithScal(e);
		a.X -= e * 0.5;
		a.Y -= e * 0.5;
		a.Z -= e * 0.5;
	}
	c.recalculateBoundingBox();
	this.OwnedMesh.Box = c.Box.clone();
	this.init();
};
CL3D.CubeSceneNode.prototype = new CL3D.MeshSceneNode();
CL3D.CubeSceneNode.prototype.createVertex = function (g, f, e, d, c, b, k, j, h) {
	var a = new CL3D.Vertex3D(true);
	a.Pos.X = g;
	a.Pos.Y = f;
	a.Pos.Z = e;
	a.Normal.X = d;
	a.Normal.Y = c;
	a.Normal.Z = b;
	a.TCoords.X = j;
	a.TCoords.Y = h;
	return a;
};
CL3D.CubeSceneNode.prototype.createClone = function (a) {
	var b = new CL3D.CubeSceneNode();
	this.cloneMembers(b, a);
	b.OwnedMesh = this.OwnedMesh;
	b.ReadonlyMaterials = this.ReadonlyMaterials;
	b.DoesCollision = this.DoesCollision;
	if (this.Box) {
		b.Box = this.Box.clone();
	}
	return b;
};
CL3D.BillboardSceneNode = function () {
	this.init();
	this.Box = new CL3D.Box3d();
	this.SizeX = 10;
	this.SizeY = 10;
	this.IsVertical = false;
	this.MeshBuffer = new CL3D.MeshBuffer();
	this.vtx1 = new CL3D.Vertex3D(true);
	this.vtx2 = new CL3D.Vertex3D(true);
	this.vtx3 = new CL3D.Vertex3D(true);
	this.vtx4 = new CL3D.Vertex3D(true);
	var c = this.MeshBuffer.Indices;
	c.push(0);
	c.push(2);
	c.push(1);
	c.push(0);
	c.push(3);
	c.push(2);
	var a = this.MeshBuffer.Vertices;
	a.push(this.vtx1);
	a.push(this.vtx2);
	a.push(this.vtx3);
	a.push(this.vtx4);
	this.vtx1.TCoords.X = 1;
	this.vtx1.TCoords.Y = 1;
	this.vtx2.TCoords.X = 1;
	this.vtx2.TCoords.Y = 0;
	this.vtx3.TCoords.X = 0;
	this.vtx3.TCoords.Y = 0;
	this.vtx4.TCoords.X = 0;
	this.vtx4.TCoords.Y = 1;
	for (var b = 0; b < 4; ++b) {
		this.Box.addInternalPointByVector(a[b].Pos);
	}
};
CL3D.BillboardSceneNode.prototype = new CL3D.SceneNode();
CL3D.BillboardSceneNode.prototype.getBoundingBox = function () {
	return this.Box;
};
CL3D.BillboardSceneNode.prototype.getType = function () {
	return "billboard";
};
CL3D.BillboardSceneNode.prototype.OnRegisterSceneNode = function (a) {
	if (this.Visible) {
		a.registerNodeForRendering(this, this.MeshBuffer.Mat.isTransparent() ? CL3D.Scene.RENDER_MODE_TRANSPARENT : CL3D.Scene.RENDER_MODE_DEFAULT);
		CL3D.SceneNode.prototype.OnRegisterSceneNode.call(this, a);
	}
};
CL3D.BillboardSceneNode.prototype.render = function (h) {
	var a = this.scene.getActiveCamera();
	if (!a) {
		return;
	}
	var j = this.getAbsolutePosition();
	var c = a.getAbsolutePosition();
	var f = a.getTarget();
	var e = a.getUpVector();
	var k = f.substract(c);
	k.normalize();
	var b = e.crossProduct(k);
	if (b.getLengthSQ() == 0) {
		b.set(e.Y, e.X, e.Z);
	}
	b.normalize();
	b.multiplyThisWithScal(0.5 * this.SizeX);
	var d = b.crossProduct(k);
	d.normalize();
	d.multiplyThisWithScal(0.5 * this.SizeY);
	if (this.IsVertical) {
		d.set(0, -0.5 * this.SizeY, 0);
	}
	k.multiplyThisWithScal(1);
	this.vtx1.Pos.setTo(j);
	this.vtx1.Pos.addToThis(b);
	this.vtx1.Pos.addToThis(d);
	this.vtx2.Pos.setTo(j);
	this.vtx2.Pos.addToThis(b);
	this.vtx2.Pos.substractFromThis(d);
	this.vtx3.Pos.setTo(j);
	this.vtx3.Pos.substractFromThis(b);
	this.vtx3.Pos.substractFromThis(d);
	this.vtx4.Pos.setTo(j);
	this.vtx4.Pos.substractFromThis(b);
	this.vtx4.Pos.addToThis(d);
	this.MeshBuffer.update();
	var g = new CL3D.Matrix4(true);
	h.setWorld(g);
	h.setMaterial(this.MeshBuffer.Mat);
	h.drawMeshBuffer(this.MeshBuffer);
};
CL3D.BillboardSceneNode.prototype.getMaterialCount = function () {
	return 1;
};
CL3D.BillboardSceneNode.prototype.getMaterial = function (a) {
	return this.MeshBuffer.Mat;
};
CL3D.BillboardSceneNode.prototype.createClone = function (a) {
	var b = new CL3D.BillboardSceneNode();
	this.cloneMembers(b, a);
	if (this.Box) {
		b.Box = this.Box.clone();
	}
	b.SizeX = this.SizeX;
	b.SizeY = this.SizeY;
	b.IsVertical = this.IsVertical;
	b.MeshBuffer.Mat = this.MeshBuffer.Mat.clone();
	return b;
};
CL3D.BillboardSceneNode.prototype.getSize = function () {
	return new CL3D.Vect2d(this.SizeX, this.SizeY);
};
CL3D.BillboardSceneNode.prototype.setSize = function (a, b) {
	this.SizeX = a;
	this.SizeY = b;
};
CL3D.PathSceneNode = function () {
	this.init();
	this.Box = new CL3D.Box3d();
	this.Tightness = 0;
	this.IsClosedCircle = false;
	this.Nodes = new Array();
};
CL3D.PathSceneNode.prototype = new CL3D.SceneNode();
CL3D.PathSceneNode.prototype.Tightness = 0;
CL3D.PathSceneNode.prototype.IsClosedCircle = false;
CL3D.PathSceneNode.prototype.Nodes = new Array();
CL3D.PathSceneNode.prototype.getBoundingBox = function () {
	return this.Box;
};
CL3D.PathSceneNode.prototype.getType = function () {
	return "path";
};
CL3D.PathSceneNode.prototype.createClone = function (b) {
	var e = new CL3D.PathSceneNode();
	this.cloneMembers(e, b);
	if (this.Box) {
		e.Box = this.Box.clone();
	}
	e.Tightness = this.Tightness;
	e.IsClosedCircle = this.IsClosedCircle;
	e.Nodes = new Array();
	for (var a = 0; a < this.Nodes.length; ++a) {
		var d = this.Nodes[a];
		e.Nodes.push(d.clone());
	}
	return e;
};
CL3D.PathSceneNode.prototype.getPathNodePosition = function (a) {
	if (a < 0 || a >= this.Nodes.length) {
		return new CL3D.Vect3d(0, 0, 0);
	}
	if (!this.AbsoluteTransformation) {
		updateAbsolutePosition();
	}
	var b = this.Nodes[a];
	b = b.clone();
	this.AbsoluteTransformation.transformVect(b);
	return b;
};
CL3D.PathSceneNode.prototype.clampPathIndex = function (a, b) {
	if (this.IsClosedCircle) {
		return (a < 0 ? (b + a) : ((a >= b) ? (a - b) : a));
	}
	return ((a < 0) ? 0 : ((a >= b) ? (b - 1) : a));
};
CL3D.PathSceneNode.prototype.getPointOnPath = function (q, a) {
	var h = this.Nodes.length;
	if (this.IsClosedCircle) {
		q *= h;
	} else {
		q = CL3D.clamp(q, 0, 1);
		q *= h - 1;
	}
	var e = new CL3D.Vect3d();
	if (h == 0) {
		return e;
	}
	if (h == 1) {
		return e;
	}
	var b = q;
	var p = CL3D.fract(b);
	var m = Math.floor(b) % h;
	var r = this.Nodes[this.clampPathIndex(m - 1, h)];
	var o = this.Nodes[this.clampPathIndex(m + 0, h)];
	var n = this.Nodes[this.clampPathIndex(m + 1, h)];
	var l = this.Nodes[this.clampPathIndex(m + 2, h)];
	var k = 2 * p * p * p - 3 * p * p + 1;
	var j = -2 * p * p * p + 3 * p * p;
	var g = p * p * p - 2 * p * p + p;
	var f = p * p * p - p * p;
	var d = n.substract(r);
	d.multiplyThisWithScal(this.Tightness);
	var c = l.substract(o);
	c.multiplyThisWithScal(this.Tightness);
	e = o.multiplyWithScal(k);
	e.addToThis(n.multiplyWithScal(j));
	e.addToThis(d.multiplyWithScal(g));
	e.addToThis(c.multiplyWithScal(f));
	if (!a) {
		if (!this.AbsoluteTransformation) {
			this.updateAbsolutePosition();
		}
		this.AbsoluteTransformation.transformVect(e);
	}
	return e;
};
CL3D.Overlay2DSceneNode = function (a) {
	this.init();
	this.engine = a;
	this.Box = new CL3D.Box3d();
	this.PosAbsoluteX = 100;
	this.PosAbsoluteY = 100;
	this.SizeAbsoluteX = 50;
	this.SizeAbsoluteY = 50;
	this.PosRelativeX = 0.5;
	this.PosRelativeY = 0.5;
	this.SizeRelativeWidth = 1 / 6;
	this.SizeRelativeHeight = 1 / 6;
	this.SizeModeIsAbsolute = true;
	this.ShowBackGround = true;
	this.BackGroundColor = 0;
	this.Texture = null;
	this.TextureHover = null;
	this.RetainAspectRatio = true;
	this.DrawText = false;
	this.TextAlignment = 1;
	this.Text = "";
	this.FontName = "";
	this.TextColor = 0;
	this.AnimateOnHover = false;
	this.OnHoverSetFontColor = false;
	this.HoverFontColor = false;
	this.OnHoverSetBackgroundColor = false;
	this.HoverBackgroundColor = false;
	this.OnHoverDrawTexture = false;
	this.TextTexture = null;
	this.TextHoverTexture = null;
	this.CreatedTextTextureText = "";
	this.CreatedTextTextureFontName = "";
	this.CurrentFontPixelHeight = 0;
};
CL3D.Overlay2DSceneNode.prototype = new CL3D.SceneNode();
CL3D.Overlay2DSceneNode.prototype.getBoundingBox = function () {
	return this.Box;
};
CL3D.Overlay2DSceneNode.prototype.getType = function () {
	return "2doverlay";
};
CL3D.Overlay2DSceneNode.prototype.set2DPosition = function (b, d, c, a) {
	this.PosAbsoluteX = b;
	this.PosAbsoluteY = d;
	this.SizeAbsoluteX = c;
	this.SizeAbsoluteY = a;
	this.SizeModeIsAbsolute = true;
};
CL3D.Overlay2DSceneNode.prototype.setShowBackgroundColor = function (b, a) {
	this.ShowBackGround = b;
	if (this.ShowBackGround) {
		this.BackGroundColor = a;
	}
};
CL3D.Overlay2DSceneNode.prototype.setShowImage = function (a) {
	this.Texture = a;
};
CL3D.Overlay2DSceneNode.prototype.setText = function (a) {
	this.Text = a;
	this.DrawText = this.Text != null && this.Text != "";
};
CL3D.Overlay2DSceneNode.prototype.OnRegisterSceneNode = function (a) {
	if (this.Visible) {
		a.registerNodeForRendering(this, CL3D.Scene.RENDER_MODE_2DOVERLAY);
		CL3D.SceneNode.prototype.OnRegisterSceneNode.call(this, a);
	}
};
CL3D.Overlay2DSceneNode.prototype.render = function (m) {
	var d = this.getScreenCoordinatesRect(true, m);
	var f = d;
	var l = false;
	if (this.engine != null && this.AnimateOnHover) {
		var c = this.engine.getMouseX();
		var b = this.engine.getMouseY();
		l = (d.x <= c && d.y <= b && d.x + d.w >= c && d.y + d.h >= b);
	}
	if (l && this.OnHoverSetBackgroundColor) {
		m.draw2DRectangle(d.x, d.y, d.w, d.h, this.HoverBackgroundColor, true);
	} else {
		if (this.ShowBackGround) {
			m.draw2DRectangle(d.x, d.y, d.w, d.h, this.BackGroundColor, true);
		}
	}
	var o = this.Texture;
	if (l && this.TextureHover && this.OnHoverDrawTexture) {
		o = this.TextureHover;
	}
	if (o != null && o.isLoaded()) {
		var n = o.getWidth();
		var k = o.getHeight();
		if (!this.RetainAspectRatio) {
			m.draw2DImage(d.x, d.y, d.w, d.h, o, true);
		} else {
			if (n && k && d.h && d.w) {
				var q = k / n;
				var a = d.w;
				var p = a * q;
				if (p > d.h) {
					var s = d.h / p;
					a *= s;
					p *= s;
				}
				d.w = a;
				d.h = p;
				f = d;
				m.draw2DImage(d.x, d.y, d.w, d.h, o, true);
			}
		};
	}
	if (this.DrawText && this.FontName && this.Text != "") {
		this.createNewTextTexturesIfNecessary(m);
		var j = this.TextTexture;
		var e = this.TextColor;
		if (l) {
			if (this.TextHoverTexture) {
				j = this.TextHoverTexture;
			}
			e = this.HoverFontColor;
		}
		if (j) {
			var g = j.OriginalWidth;
			var r = j.OriginalHeight;
			if (this.TextAlignment == 0) {
				m.draw2DFontImage(d.x, d.y, g, r, j, e);
			} else {
				m.draw2DFontImage(d.x + ((d.w - g) / 2), d.y + ((d.h - r) / 2), g, r, j, e);
			}
		};
	} else {
		this.destroyTextTextures(m);
	}
};
CL3D.Overlay2DSceneNode.prototype.destroyTextTextures = function (a) {
	a.deleteTexture(this.TextTexture);
	a.deleteTexture(this.TextHoverTexture);
	this.TextTexture = null;
	this.TextHoverTexture = null;
};
CL3D.Overlay2DSceneNode.prototype.createNewTextTexturesIfNecessary = function (f) {
	var d = false;
	var a = this.TextTexture == null || (d && this.TextHoverTexture == null);
	if (!a) {
		a = this.CreatedTextTextureText != this.Text || this.CreatedTextTextureFontName != this.FontName;
	}
	if (!a) {
		return;
	}
	this.destroyTextTextures(f);
	var b = document.createElement("canvas");
	if (b == null) {
		return;
	}
	b.width = 1;
	b.height = 1;
	var h = b.getContext("2d");
	if (h == null) {
		return;
	}
	var j = 12;
	var c = this.parseCopperCubeFontString(this.FontName);
	h.font = c;
	var e = h.measureText(this.Text);
	b.width = e.width;
	b.height = this.CurrentFontPixelHeight * 1.2;
	h.fillStyle = "rgba(0, 0, 0, 1)";
	h.fillRect(0, 0, b.width, b.height);
	h.fillStyle = "rgba(255, 255, 255, 1)";
	h.textBaseline = "top";
	h.font = c;
	h.fillText(this.Text, 0, 0);
	var g = f.createTextureFrom2DCanvas(b, true);
	this.TextTexture = g;
	this.TextHoverTexture = g;
	this.CreatedTextTextureText = this.Text;
	this.CreatedTextTextureFontName = this.FontName;
};
CL3D.Overlay2DSceneNode.prototype.getMaterialCount = function () {
	return 0;
};
CL3D.Overlay2DSceneNode.prototype.getScreenCoordinatesRect = function (d, e) {
	var b = e.getWidth();
	var c = e.getHeight();
	var a = new Object();
	if (this.SizeModeIsAbsolute) {
		a.x = this.PosAbsoluteX;
		a.y = this.PosAbsoluteY;
		a.w = this.SizeAbsoluteX;
		a.h = this.SizeAbsoluteY;
	} else {
		a.x = this.PosRelativeX * b;
		a.y = this.PosRelativeY * c;
		a.w = this.SizeRelativeWidth * b;
		a.h = this.SizeRelativeHeight * c;
	}
	return a;
};
CL3D.Overlay2DSceneNode.prototype.createClone = function (a) {
	var b = new CL3D.Overlay2DSceneNode();
	this.cloneMembers(b, a);
	b.PosAbsoluteX = this.PosAbsoluteX;
	b.PosAbsoluteY = this.PosAbsoluteY;
	b.SizeAbsoluteX = this.SizeAbsoluteX;
	b.SizeAbsoluteY = this.SizeAbsoluteY;
	b.PosRelativeX = this.PosRelativeX;
	b.PosRelativeY = this.PosRelativeY;
	b.SizeRelativeWidth = this.SizeRelativeWidth;
	b.SizeRelativeHeight = this.SizeRelativeHeight;
	b.SizeModeIsAbsolute = this.SizeModeIsAbsolute;
	b.ShowBackGround = this.ShowBackGround;
	b.BackGroundColor = this.BackGroundColor;
	b.Texture = this.Texture;
	b.TextureHover = this.TextureHover;
	b.RetainAspectRatio = this.RetainAspectRatio;
	b.DrawText = this.DrawText;
	b.TextAlignment = this.TextAlignment;
	b.Text = this.Text;
	b.FontName = this.FontName;
	b.TextColor = this.TextColor;
	b.AnimateOnHover = this.AnimateOnHover;
	b.OnHoverSetFontColor = this.OnHoverSetFontColor;
	b.HoverFontColor = this.HoverFontColor;
	b.OnHoverSetBackgroundColor = this.OnHoverSetBackgroundColor;
	b.HoverBackgroundColor = this.HoverBackgroundColor;
	b.OnHoverDrawTexture = this.OnHoverDrawTexture;
	return b;
};
CL3D.Overlay2DSceneNode.prototype.parseCopperCubeFontString = function (c) {
	var d = 12;
	var f = "Arial";
	var g = false;
	var a = false;
	if (c.indexOf("#fnt_") == 0) {
		c = c.substr(5);
	}
	var k = c.split(";");
	for (var e = 0; e < k.length; ++e) {
		var l = k[e];
		var b = l.toLowerCase();
		if (e == 0) {
			var j = parseInt(b);
			d = j;
		} else {
			if (e == 2) {
				f = l;
			} else {
				if (e == 3) {
					if (b.indexOf("italic") != -1) {
						g = true;
					}
				} else {
					if (e == 4) {
						if (b.indexOf("bold") != -1) {
							a = true;
						}
					};
				}
			};
		}
	}
	var h = "";
	if (g) {
		h += "italic ";
	}
	if (a) {
		h += "bold ";
	}
	this.CurrentFontPixelHeight = (d * 96 / 72);
	h += this.CurrentFontPixelHeight + "px ";
	h += f;
	return h;
};
CL3D.HotspotSceneNode = function () {
	this.Box = new CL3D.Box3d();
	this.Width = 0;
	this.Height = 0;
};
CL3D.HotspotSceneNode.prototype = new CL3D.SceneNode();
CL3D.DummyTransformationSceneNode = function () {
	this.init();
	this.Box = new CL3D.Box3d();
};
CL3D.DummyTransformationSceneNode.prototype = new CL3D.SceneNode();
CL3D.DummyTransformationSceneNode.prototype.createClone = function (a) {
	var b = new DummyTransformationSceneNode();
	this.cloneMembers(b, a);
	if (this.Box) {
		b.Box = this.Box.clone();
	}
	return b;
};
CL3D.AnimatedMeshSceneNode = function () {
	this.init();
	this.Box = new CL3D.Box3d();
	this.DoesCollision = false;
	this.Mesh = null;
	this.Selector = null;
	this.LastLODSkinnedAnimationTime = 0;
	this.Transiting = 0;
	this.TransitingBlend = 0;
	this.Materials = new Array();
	this.FramesPerSecond = 25 / 100;
	this.BeginFrameTime = CL3D.CLTimer.getTime();
	this.FrameWhenCurrentMeshWasGenerated = 0;
	this.StartFrame = 0;
	this.EndFrame = 0;
	this.Looping = false;
	this.CurrentFrameNr = 0;
	this.MinimalUpdateDelay = 60;
};
CL3D.AnimatedMeshSceneNode.prototype = new CL3D.SceneNode();
CL3D.AnimatedMeshSceneNode.prototype.getBoundingBox = function () {
	return this.Box;
};
CL3D.AnimatedMeshSceneNode.prototype.getNamedAnimationCount = function () {
	if (this.Mesh && this.Mesh.NamedAnimationRanges) {
		return this.Mesh.NamedAnimationRanges.length;
	}
	return 0;
};
CL3D.AnimatedMeshSceneNode.prototype.getNamedAnimationInfo = function (b) {
	var a = this.getNamedAnimationCount();
	if (b >= 0 && b < a) {
		return this.Mesh.NamedAnimationRanges[b];
	}
	return null;
};
CL3D.AnimatedMeshSceneNode.prototype.setAnimation = function (a) {
	if (!this.Mesh) {
		return false;
	}
	var b = this.Mesh.getNamedAnimationRangeByName(a);
	if (!b) {
		return false;
	}
	this.setFrameLoop(b.Begin, b.End);
	this.setAnimationSpeed(b.FPS);
	return true;
};
CL3D.AnimatedMeshSceneNode.prototype.setMesh = function (a) {
	if (!a) {
		return;
	}
	this.Mesh = a;
	this.Box = a.getBoundingBox();
	this.setFrameLoop(0, a.getFrameCount());
};
CL3D.AnimatedMeshSceneNode.prototype.getType = function () {
	return "animatedmesh";
};
CL3D.AnimatedMeshSceneNode.prototype.OnRegisterSceneNode = function (a) {
	if (this.Visible && this.Mesh) {
		a.registerNodeForRendering(this, CL3D.Scene.RENDER_MODE_DEFAULT);
		CL3D.SceneNode.prototype.OnRegisterSceneNode.call(this, a);
	}
};
CL3D.AnimatedMeshSceneNode.prototype.render = function (a) {
	a.setWorld(this.AbsoluteTransformation);
	a.drawMesh(this.OwnedMesh);
};
CL3D.AnimatedMeshSceneNode.prototype.getMaterialCount = function () {
	if (this.OwnedMesh) {
		return this.OwnedMesh.MeshBuffers.length;
	}
	return 0;
};
CL3D.AnimatedMeshSceneNode.prototype.getMaterial = function (a) {
	if (this.Materials) {
		if (a >= 0 && a < this.Materials.length) {
			return this.Materials[a];
		} else {
			if (this.Mesh && this.Mesh.AnimatedMeshesToLink && (a >= 0) && (this.Materials.length == a) && (a < 256)) {
				var b = new CL3D.Material();
				this.Materials.push(b);
				return b;
			}
		};
	}
	return null;
};
CL3D.AnimatedMeshSceneNode.prototype.createClone = function (b) {
	var d = new CL3D.AnimatedMeshSceneNode();
	this.cloneMembers(d, b);
	d.Mesh = this.Mesh;
	if (this.Box) {
		d.Box = this.Box.clone();
	}
	d.DoesCollision = this.DoesCollision;
	d.Selector = this.Selector;
	d.LastLODSkinnedAnimationTime = this.LastLODSkinnedAnimationTime;
	d.Transiting = this.Transiting;
	d.TransitingBlend = this.TransitingBlend;
	d.Materials = new Array();
	for (var a = 0; a < this.Materials.length; ++a) {
		d.Materials.push(this.Materials[a].clone());
	}
	d.FramesPerSecond = this.FramesPerSecond;
	d.BeginFrameTime = this.BeginFrameTime;
	d.FrameWhenCurrentMeshWasGenerated = this.FrameWhenCurrentMeshWasGenerated;
	d.StartFrame = this.StartFrame;
	d.EndFrame = this.EndFrame;
	d.Looping = this.Looping;
	d.CurrentFrameNr = this.CurrentFrameNr;
	d.MinimalUpdateDelay = this.MinimalUpdateDelay;
	return d;
};
CL3D.AnimatedMeshSceneNode.prototype.setAnimationSpeed = function (a) {
	this.FramesPerSecond = a;
};
CL3D.AnimatedMeshSceneNode.prototype.setLoopMode = function (a) {
	this.Looping = a;
};
CL3D.AnimatedMeshSceneNode.prototype.setFrameLoop = function (c, a) {
	if (!this.Mesh) {
		return false;
	}
	var b = this.Mesh.getFrameCount() - 1;
	if (a < c) {
		this.StartFrame = CL3D.clamp(a, 0, b);
		this.EndFrame = CL3D.clamp(c, this.StartFrame, b);
	} else {
		this.StartFrame = CL3D.clamp(c, 0, b);
		this.EndFrame = CL3D.clamp(a, this.StartFrame, b);
	}
	this.setCurrentFrame(this.StartFrame);
	return true;
};
CL3D.AnimatedMeshSceneNode.prototype.setCurrentFrame = function (a) {
	this.CurrentFrameNr = CL3D.clamp(a, this.StartFrame, this.EndFrame);
	this.BeginFrameTime = CL3D.CLTimer.getTime() - Math.floor((this.CurrentFrameNr - this.StartFrame) / this.FramesPerSecond);
};
CL3D.AnimatedMeshSceneNode.prototype.buildFrameNr = function (d) {
	var c = 0;
	if (this.Transiting != 0) {
		this.TransitingBlend = (d - this.BeginFrameTime) * this.Transiting;
		if (this.TransitingBlend > 1) {
			this.Transiting = 0;
			this.TransitingBlend = 0;
		}
	}
	if (this.StartFrame == this.EndFrame) {
		return this.StartFrame;
	}
	if (this.FramesPerSecond == 0) {
		return this.StartFrame;
	}
	var b = 0;
	if (this.Looping) {
		var a = Math.abs(Math.floor((this.EndFrame - this.StartFrame) / this.FramesPerSecond));
		if (this.FramesPerSecond > 0) {
			b = this.StartFrame + ((d - this.BeginFrameTime) % a) * this.FramesPerSecond;
		} else {
			b = this.EndFrame - ((d - this.BeginFrameTime) % a) * -this.FramesPerSecond;
		}
	} else {
		if (this.FramesPerSecond > 0) {
			c = (d - this.BeginFrameTime) * this.FramesPerSecond;
			b = this.StartFrame + c;
			if (b > this.EndFrame) {
				b = this.EndFrame;
			}
		} else {
			c = (d - this.BeginFrameTime) * (-this.FramesPerSecond);
			b = this.EndFrame - c;
			if (b < this.StartFrame) {
				b = this.StartFrame;
			}
		};
	}
	return b;
};
CL3D.AnimatedMeshSceneNode.prototype.getFrameNr = function () {
	return this.CurrentFrameNr;
};
CL3D.AnimatedMeshSceneNode.prototype.calculateMeshForCurrentFrame = function () {
	var d = this.Mesh;
	if (!d) {
		return;
	}
	var b = false;
	b = d.animateMesh(this.getFrameNr(), 1);
	if (b) {
		d.skinMesh();
		d.updateBoundingBox();
		this.Box = d.getBoundingBox().clone();
		for (var c = 0; c < d.LocalBuffers.length; ++c) {
			var a = d.LocalBuffers[c];
			a.update();
		}
	}
	this.FrameWhenCurrentMeshWasGenerated = this.CurrentFrameNr;
};
CL3D.AnimatedMeshSceneNode.prototype.setMinimalUpdateDelay = function (a) {
	this.MinimalUpdateDelay = a;
};
CL3D.AnimatedMeshSceneNode.prototype.OnAnimate = function (c, e) {
	var b = false;
	var a = CL3D.CLTimer.getTime();
	if (this.LastLODSkinnedAnimationTime == 0 || a - this.LastLODSkinnedAnimationTime > this.MinimalUpdateDelay) {
		var d = this.buildFrameNr(e);
		b = this.CurrentFrameNr != d;
		this.CurrentFrameNr = d;
		this.LastLODSkinnedAnimationTime = a;
	}
	return CL3D.SceneNode.prototype.OnAnimate.call(this, c, e);
};
CL3D.AnimatedMeshSceneNode.prototype.render = function (c) {
	c.setWorld(this.AbsoluteTransformation);
	var d = this.Mesh;
	if (d) {
		this.calculateMeshForCurrentFrame();
		for (var b = 0; b < d.LocalBuffers.length; ++b) {
			var a = d.LocalBuffers[b];
			if (b < this.Materials.length) {
				a.Mat = this.Materials[b];
			}
			if (a.Transformation != null) {
				c.setWorld(AbsoluteTransformation.multiply(a.Transformation));
			}
			c.setMaterial(a.Mat);
			c.drawMeshBuffer(a);
			if (a.Transformation != null) {
				c.setWorld(AbsoluteTransformation);
			}
		};
	}
};
CL3D.Animator = function () {
	this.Type = -1;
};
CL3D.Animator.prototype.getType = function () {
	return "none";
};
CL3D.Animator.prototype.animateNode = function (b, a) {
	return false;
};
CL3D.Animator.prototype.onMouseDown = function (a) {};
CL3D.Animator.prototype.onMouseWheel = function (a) {};
CL3D.Animator.prototype.onMouseUp = function (a) {};
CL3D.Animator.prototype.onMouseMove = function (a) {};
CL3D.Animator.prototype.onKeyDown = function (a) {};
CL3D.Animator.prototype.onKeyUp = function (a) {};
CL3D.Animator.prototype.reset = function (a) {};
CL3D.AnimatorCameraFPS = function (b, a) {
	this.Type = -1;
	this.lastAnimTime = 0;
	this.NoVerticalMovement = false;
	this.moveByMouseDown = true;
	this.moveByMouseMove = false;
	this.moveByPanoDrag = false;
	this.leftKeyDown = false;
	this.rightKeyDown = false;
	this.upKeyDown = false;
	this.downKeyDown = false;
	this.jumpKeyDown = false;
	this.relativeRotationX = 0;
	this.relativeRotationY = 0;
	this.minZoom = 20;
	this.maxZoom = 100;
	this.zoomSpeed = (this.maxZoom - this.minZoom) / 50;
	this.startZoomValue = this.minZoom;
	this.targetZoomValue = 90;
	this.lastAnimTime = CL3D.CLTimer.getTime();
	this.Camera = b;
	this.CursorControl = a;
	if (b) {
		this.lookAt(b.getTarget());
	}
};
CL3D.AnimatorCameraFPS.prototype = new CL3D.Animator();
CL3D.AnimatorCameraFPS.prototype.getType = function () {
	return "camerafps";
};
CL3D.AnimatorCameraFPS.prototype.MaxVerticalAngle = 88;
CL3D.AnimatorCameraFPS.prototype.MoveSpeed = 0.06;
CL3D.AnimatorCameraFPS.prototype.RotateSpeed = 200;
CL3D.AnimatorCameraFPS.prototype.JumpSpeed = 0;
CL3D.AnimatorCameraFPS.prototype.NoVerticalMovement = false;
CL3D.AnimatorCameraFPS.prototype.MayMove = true;
CL3D.AnimatorCameraFPS.prototype.MayZoom = true;
CL3D.AnimatorCameraFPS.prototype.setMayMove = function (a) {
	this.MayMove = a;
};
CL3D.AnimatorCameraFPS.prototype.setLookByMouseDown = function (a) {
	this.moveByMouseDown = a;
	this.moveByMouseMove = !a;
};
CL3D.AnimatorCameraFPS.prototype.lookAt = function (b) {
	if (this.Camera == null) {
		return;
	}
	var a = b.substract(this.Camera.Pos);
	a = a.getHorizontalAngle();
	this.relativeRotationX = a.X;
	this.relativeRotationY = a.Y;
	if (this.relativeRotationX > this.MaxVerticalAngle) {
		this.relativeRotationX -= 360;
	}
};
CL3D.AnimatorCameraFPS.prototype.animateNode = function (l, v) {
	if (this.Camera == null) {
		return false;
	}
	var b = CL3D.CLTimer.getTime();
	var k = b - this.lastAnimTime;
	if (k > 250) {
		k = 250;
	}
	this.lastAnimTime = b;
	var e = this.Camera.Pos.clone();
	if (this.MayMove && (this.upKeyDown || this.downKeyDown)) {
		var g = this.Camera.Pos.substract(this.Camera.getTarget());
		if (this.NoVerticalMovement) {
			g.Y = 0;
		}
		g.normalize();
		if (this.upKeyDown) {
			e.addToThis(g.multiplyWithScal(this.MoveSpeed * -k));
		}
		if (this.downKeyDown) {
			e.addToThis(g.multiplyWithScal(this.MoveSpeed * k));
		}
	}
	if (this.MayMove && (this.leftKeyDown || this.rightKeyDown)) {
		var d = this.Camera.Pos.substract(this.Camera.getTarget()).crossProduct(this.Camera.getUpVector());
		d.normalize();
		if (this.leftKeyDown) {
			d = d.multiplyWithScal(this.MoveSpeed * -k);
			e.addToThis(d);
			this.Camera.setTarget(this.Camera.getTarget().add(d));
		}
		if (this.rightKeyDown) {
			d = d.multiplyWithScal(this.MoveSpeed * k);
			e.addToThis(d);
			this.Camera.setTarget(this.Camera.getTarget().add(d));
		}
	}
	this.Camera.Pos = e;
	if (this.MayZoom) {
		var h = CL3D.radToDeg(this.Camera.getFov());
		this.targetZoomValue += this.getAdditionalZoomDiff() * k;
		if (this.targetZoomValue < this.minZoom) {
			this.targetZoomValue = this.minZoom;
		}
		if (this.targetZoomValue > this.maxZoom) {
			this.targetZoomValue = this.maxZoom;
		}
		var s = this.zoomSpeed;
		s = Math.abs(this.targetZoomValue - h) / 8;
		if (s < this.zoomSpeed) {
			s = this.zoomSpeed;
		}
		if (h < this.maxZoom - s && h < this.targetZoomValue) {
			h += s;
			if (h > this.maxZoom) {
				h = this.maxZoom;
			}
		}
		if (h > this.minZoom + s && h > this.targetZoomValue) {
			h -= s;
			if (h < this.minZoom) {
				h = this.minZoom;
			}
		}
		this.Camera.setFov(CL3D.degToRad(h));
	}
	var x = new CL3D.Vect3d(0, 0, 1);
	var t = new CL3D.Matrix4();
	t.setRotationDegrees(new CL3D.Vect3d(this.relativeRotationX, this.relativeRotationY, 0));
	t.transformVect(x);
	var u = 300;
	var c = 0;
	var o = 1 / 50000;
	var m = 1 / 50000;
	if (this.moveByMouseDown) {
		o *= 3;
		m *= 3;
	}
	if (this.moveByMouseMove) {
		var f = this.CursorControl.getRenderer().getHeight();
		var p = this.CursorControl.getMouseY();
		if (f > 0 && p > 0 && this.CursorControl.isMouseOverCanvas()) {
			c = Math.sin((p - (f / 2)) / f) * 100 * 0.5;
		}
	} else {
		if (this.moveByMouseDown || this.moveByPanoDrag) {
			if (this.CursorControl.isMouseDown()) {
				c = this.CursorControl.getMouseY() - this.CursorControl.getMouseDownY();
			}
		};
	}
	c += this.getAdditionalYLookDiff();
	if (c > u) {
		c = u;
	}
	if (c < -u) {
		c = -u;
	}
	this.relativeRotationX += c * (k * (this.RotateSpeed * m));
	if (this.relativeRotationX < -this.MaxVerticalAngle) {
		this.relativeRotationX = -this.MaxVerticalAngle;
	}
	if (this.relativeRotationX > this.MaxVerticalAngle) {
		this.relativeRotationX = this.MaxVerticalAngle;
	}
	var j = 0;
	if (this.moveByMouseMove) {
		var r = this.CursorControl.getRenderer().getWidth();
		var q = this.CursorControl.getMouseX();
		if (r > 0 && q > 0 && this.CursorControl.isMouseOverCanvas()) {
			j = Math.sin((q - (r / 2)) / r) * 100 * 0.5;
		}
	} else {
		if (this.moveByMouseDown || this.moveByPanoDrag) {
			if (this.CursorControl.isMouseDown()) {
				j = (this.CursorControl.getMouseX() - this.CursorControl.getMouseDownX());
			}
		};
	}
	j += this.getAdditionalXLookDiff();
	if (j > u) {
		j = u;
	}
	if (j < -u) {
		j = -u;
	}
	this.relativeRotationY += j * (k * (this.RotateSpeed * o));
	if (this.moveByMouseDown || this.moveByPanoDrag) {
		this.CursorControl.setMouseDownWhereMouseIsNow();
	}
	if (this.MayMove && this.jumpKeyDown) {
		var w = l.getAnimatorOfType("collisionresponse");
		if (w && !w.isFalling()) {
			w.jump(this.JumpSpeed);
		}
	}
	this.Camera.setTarget(this.Camera.Pos.add(x));
	return false;
};
CL3D.AnimatorCameraFPS.prototype.onMouseDown = function (a) {
	CL3D.Animator.prototype.onMouseDown.call(this, a);
};
CL3D.AnimatorCameraFPS.prototype.onMouseWheel = function (a) {
	CL3D.Animator.prototype.onMouseWheel.call(this, a);
	this.targetZoomValue += a.delta * this.zoomSpeed;
	if (this.targetZoomValue < this.minZoom) {
		this.targetZoomValue = this.minZoom;
	}
	if (this.targetZoomValue > this.maxZoom) {
		this.targetZoomValue = this.maxZoom;
	}
};
CL3D.AnimatorCameraFPS.prototype.onMouseUp = function (a) {
	CL3D.Animator.prototype.onMouseUp.call(this, a);
};
CL3D.AnimatorCameraFPS.prototype.onMouseMove = function (a) {
	CL3D.Animator.prototype.onMouseMove.call(this, a);
};
CL3D.AnimatorCameraFPS.prototype.setKeyBool = function (b, a) {
	if (a == 37 || a == 65) {
		this.leftKeyDown = b;
		if (b) {
			this.rightKeyDown = false;
		}
	}
	if (a == 39 || a == 68) {
		this.rightKeyDown = b;
		if (b) {
			this.leftKeyDown = false;
		}
	}
	if (a == 38 || a == 87) {
		this.upKeyDown = b;
		if (b) {
			this.downKeyDown = false;
		}
	}
	if (a == 40 || a == 83) {
		this.downKeyDown = b;
		if (b) {
			this.upKeyDown = false;
		}
	}
	if (a == 32) {
		this.jumpKeyDown = b;
	}
};
CL3D.AnimatorCameraFPS.prototype.onKeyDown = function (a) {
	this.setKeyBool(true, a.keyCode);
};
CL3D.AnimatorCameraFPS.prototype.onKeyUp = function (a) {
	this.setKeyBool(false, a.keyCode);
};
CL3D.AnimatorCameraFPS.prototype.getAdditionalXLookDiff = function () {
	return 0;
};
CL3D.AnimatorCameraFPS.prototype.getAdditionalYLookDiff = function () {
	return 0;
};
CL3D.AnimatorCameraFPS.prototype.getAdditionalZoomDiff = function () {
	return 0;
};
CL3D.AnimatorCameraModelViewer = function (b, a, rotateButtons) {
	this.Type = -1;
	this.RotateSpeed = 16;
	this.Radius = 100;
	this.NoVerticalMovement = false;
	this.lastAnimTime = CL3D.CLTimer.getTime();
	this.Camera = b;
	this.CursorControl = a;
	this.RotateButtons = rotateButtons || [0, 1, 2];
};
CL3D.AnimatorCameraModelViewer.prototype = new CL3D.Animator();
CL3D.AnimatorCameraModelViewer.prototype.getType = function () {
	return "cameramodelviewer";
};
CL3D.AnimatorCameraModelViewer.prototype.RotateSpeed = 0.06;
CL3D.AnimatorCameraModelViewer.prototype.Radius = 100;
CL3D.AnimatorCameraModelViewer.prototype.NoVerticalMovement = false;
CL3D.AnimatorCameraModelViewer.prototype.animateNode = function (e, c) {
	if (this.Camera == null) {
		return false;
	}
	var b = CL3D.CLTimer.getTime();
	var a = b - this.lastAnimTime;
	if (a > 250) {
		a = 250;
	}
	this.lastAnimTime = b;
	var o = this.Camera.Pos.clone();
	var j = this.Camera.Target.clone();
	var m = j.substract(this.Camera.getAbsolutePosition());
	var f = 0;
	var d = 0;
	if (this.CursorControl.isMouseDown() && this.RotateButtons.indexOf(this.CursorControl.MouseButtonDown) >= 0) {
		f = (this.CursorControl.getMouseX() - this.CursorControl.getMouseDownX()) * this.RotateSpeed / 50000;
		d = (this.CursorControl.getMouseY() - this.CursorControl.getMouseDownY()) * this.RotateSpeed / 50000;
	}
	var l = m.crossProduct(this.Camera.UpVector);
	l.Y = 0;
	l.normalize();
	if (!CL3D.iszero(f)) {
		l.multiplyThisWithScal(a * f * this.Radius);
		o.addToThis(l);
	}
	if (!this.NoVerticalMovement && !CL3D.iszero(d)) {
		var h = this.Camera.UpVector.clone();
		h.normalize();
		var k = o.add(h.multiplyWithScal(a * d * this.Radius));
		var g = k.clone();
		g.Y = j.Y;
		var p = this.Radius / 10;
		if (g.getDistanceTo(j) > p) {
			o = k;
		}
	}
	this.CursorControl.setMouseDownWhereMouseIsNow();
	m = o.substract(j);
	m.setLength(this.Radius);
	o = j.add(m);
	this.Camera.Pos = o;
	return false;
};
CL3D.AnimatorFollowPath = function (a) {
	this.TimeNeeded = 5000;
	this.TriedToLinkWithPath = false;
	this.IsCamera = false;
	this.LookIntoMovementDirection = false;
	this.OnlyMoveWhenCameraActive = true;
	this.TimeDisplacement = 0;
	this.LastTimeCameraWasInactive = true;
	this.EndMode = CL3D.AnimatorFollowPath.EFPFEM_START_AGAIN;
	this.SwitchedToNextCamera = false;
	this.Manager = a;
	this.StartTime = 0;
	this.TriedToLinkWithPath = false;
	this.LastObject = null;
	this.PathNodeToFollow = null;
	this.SwitchedToNextCamera = false;
	this.PathToFollow = null;
	this.TimeDisplacement = 0;
	this.AdditionalRotation = null;
	this.CameraToSwitchTo = null;
};
CL3D.AnimatorFollowPath.prototype = new CL3D.Animator();
CL3D.AnimatorFollowPath.EFPFEM_START_AGAIN = 0;
CL3D.AnimatorFollowPath.EFPFEM_STOP = 1;
CL3D.AnimatorFollowPath.EFPFEM_SWITCH_TO_CAMERA = 2;
CL3D.AnimatorFollowPath.prototype.getType = function () {
	return "followpath";
};
CL3D.AnimatorFollowPath.prototype.setOptions = function (b, c, a) {
	this.EndMode = CL3D.AnimatorFollowPath.EFPFEM_START_AGAIN;
	this.LookIntoMovementDirection = a;
	this.TimeNeeded = c;
};
CL3D.AnimatorFollowPath.prototype.animateNode = function (d, c) {
	if (d == null || !this.Manager || !this.TimeNeeded) {
		return false;
	}
	if (!(d === this.LastObject)) {
		this.setNode(d);
		return false;
	}
	this.linkWithPath();
	if (this.PathNodeToFollow == null) {
		return false;
	}
	var f = false;
	var a = null;
	if (this.IsCamera && this.OnlyMoveWhenCameraActive) {
		var e = !this.LastTimeCameraWasInactive;
		a = d;
		if (!(this.Manager.getActiveCamera() === a)) {
			if (this.PathNodeToFollow.Nodes.length) {
				a.Pos = this.PathNodeToFollow.getPathNodePosition(0);
			}
			this.LastTimeCameraWasInactive = true;
			return false;
		} else {
			this.LastTimeCameraWasInactive = false;
		}
		if (!this.StartTime || !e) {
			this.StartTime = c;
		}
	}
	if (!this.StartTime) {
		this.StartTime = this.Manager.getStartTime();
	}
	var p = (c - this.StartTime + this.TimeDisplacement) / this.TimeNeeded;
	if (p > 1 && !this.PathNodeToFollow.IsClosedCircle) {
		switch (this.EndMode) {
		case CL3D.AnimatorFollowPath.EFPFEM_START_AGAIN:
			p = p % 1;
			break;
		case CL3D.AnimatorFollowPath.EFPFEM_STOP:
			p = 1;
			break;
		case CL3D.AnimatorFollowPath.EFPFEM_SWITCH_TO_CAMERA:
			p = 1;
			if (!this.SwitchedToNextCamera) {
				this.switchToNextCamera();
				this.SwitchedToNextCamera = true;
			}
			break;
		}
	} else {
		this.SwitchedToNextCamera = false;
	}
	var m = this.PathNodeToFollow.getPointOnPath(p);
	f = !m.equals(d.Pos);
	d.Pos = m;
	if (this.LookIntoMovementDirection && this.PathNodeToFollow.Nodes.length) {
		var g = p + 0.001;
		var h;
		if (this.PathNodeToFollow.IsClosedCircle) {
			h = this.PathNodeToFollow.getPointOnPath(g);
		} else {
			h = this.PathNodeToFollow.getPointOnPath(g);
		}
		if (!CL3D.iszero(h.getDistanceTo(m))) {
			var l = h.substract(m);
			l.setLength(100);
			if (this.IsCamera) {
				a = d;
				var k = m.add(l);
				f = f || !k.equals(a.Target);
				a.setTarget(k);
			} else {
				var b;
				if (!this.AdditionalRotation || this.AdditionalRotation.equalsZero()) {
					b = l.getHorizontalAngle();
					f = f || !b.equals(d.Rot);
					d.Rot = b;
				} else {
					var o = new CL3D.Matrix4();
					o.setRotationDegrees(l.getHorizontalAngle());
					var j = new CL3D.Matrix4();
					j.setRotationDegrees(this.AdditionalRotation);
					o = o.multiply(j);
					b = o.getRotationDegrees();
					f = f || !b.equals(d.Rot);
					d.Rot = b;
				}
			};
		}
	}
	return f;
};
CL3D.AnimatorFollowPath.prototype.setNode = function (a) {
	this.LastObject = a;
	if (this.LastObject) {
		this.IsCamera = (this.LastObject.getType() == "camera");
	}
};
CL3D.AnimatorFollowPath.prototype.linkWithPath = function () {
	if (this.PathNodeToFollow) {
		return;
	}
	if (this.TriedToLinkWithPath) {
		return;
	}
	if (!this.PathToFollow.length) {
		return;
	}
	if (!this.Manager) {
		return;
	}
	var a = this.Manager.getSceneNodeFromName(this.PathToFollow);
	if (a && a.getType() == "path") {
		this.setPathToFollow(a);
	}
};
CL3D.AnimatorFollowPath.prototype.setPathToFollow = function (a) {
	this.PathNodeToFollow = a;
};
CL3D.AnimatorFollowPath.prototype.switchToNextCamera = function () {
	if (!this.Manager) {
		return;
	}
	if (!this.CameraToSwitchTo.length) {
		return;
	}
	var a = this.Manager.getSceneNodeFromName(this.CameraToSwitchTo);
	if (a && a.getType() == "camera") {
		var b = this.Manager.getLastUsedRenderer();
		if (b) {
			a.setAutoAspectIfNoFixedSet(b.getWidth(), b.getHeight());
		}
		this.Manager.setActiveCamera(a);
	}
};
CL3D.AnimatorFlyStraight = function (f, c, e, b, d, a) {
	this.Start = new CL3D.Vect3d(0, 0, 0);
	this.End = new CL3D.Vect3d(40, 40, 40);
	this.StartTime = CL3D.CLTimer.getTime();
	this.TimeForWay = 3000;
	this.Loop = false;
	this.DeleteMeAfterEndReached = false;
	this.AnimateCameraTargetInsteadOfPosition = false;
	this.TestShootCollisionWithBullet = false;
	this.ShootCollisionNodeToIgnore = null;
	this.ShootCollisionDamage = 0;
	this.DeleteSceneNodeAfterEndReached = false;
	if (f) {
		this.Start = f.clone();
	}
	if (c) {
		this.End = c.clone();
	}
	if (e) {
		this.TimeForWay = e;
	}
	if (b) {
		this.Loop = b;
	}
	this.recalculateImidiateValues();
	if (d) {
		this.DeleteMeAfterEndReached = d;
	}
	if (a) {
		this.AnimateCameraTargetInsteadOfPosition = a;
	}
};
CL3D.AnimatorFlyStraight.prototype = new CL3D.Animator();
CL3D.AnimatorFlyStraight.prototype.getType = function () {
	return "flystraight";
};
CL3D.AnimatorFlyStraight.prototype.animateNode = function (f, e) {
	var b = (e - this.StartTime);
	var c = false;
	if (b != 0) {
		var d = this.Start.clone();
		if (!this.Loop && b >= this.TimeForWay) {
			d = this.End.clone();
			c = true;
		} else {
			d.addToThis(this.Vector.multiplyWithScal((b % this.TimeForWay) * this.TimeFactor));
		}
		if (this.AnimateCameraTargetInsteadOfPosition) {
			if (f.getType() == "camera") {
				f.setTarget(d);
				var a = f.getAnimatorOfType("camerafps");
				if (a != null) {
					a.lookAt(d);
				}
			};
		} else {
			f.Pos = d;
		}
		if (this.TestShootCollisionWithBullet) {
			c = this.doShootCollisionTest(f) || c;
		}
		if (c) {
			if (this.DeleteMeAfterEndReached) {
				f.removeAnimator(this);
			}
			if (this.DeleteSceneNodeAfterEndReached && f.Parent) {
				f.Parent.removeChild(f);
			}
		}
		return true;
	}
	return false;
};
CL3D.AnimatorFlyStraight.prototype.doShootCollisionTest = function (f) {
	if (!f) {
		return false;
	}
	f.updateAbsolutePosition();
	var c = f.getTransformedBoundingBox();
	var e = false;
	var a = f.scene.getAllSceneNodesWithAnimator("gameai");
	for (var b = 0; b < a.length; ++b) {
		if (a[b] === this.ShootCollisionNodeToIgnore) {
			continue;
		}
		var d = a[b].getAnimatorOfType("gameai");
		if (d && !d.isAlive()) {
			continue;
		}
		if (c.intersectsWithBox(a[b].getTransformedBoundingBox())) {
			d.OnHit(this.ShootCollisionDamage, a[b]);
			e = true;
			break;
		}
	}
	return e;
};
CL3D.AnimatorFlyStraight.prototype.recalculateImidiateValues = function () {
	this.Vector = this.End.substract(this.Start);
	this.WayLength = this.Vector.getLength();
	this.Vector.normalize();
	this.TimeFactor = this.WayLength / this.TimeForWay;
};
CL3D.AnimatorFlyCircle = function (b, a, d, c) {
	this.Center = new CL3D.Vect3d();
	this.Direction = new CL3D.Vect3d(0, 1, 0);
	this.VecU = new CL3D.Vect3d();
	this.VecV = new CL3D.Vect3d();
	this.StartTime = CL3D.CLTimer.getTime();
	this.Speed = 0.01;
	this.Radius = 100;
	if (b) {
		this.Center = b.clone();
	}
	if (a) {
		this.Radius = a;
	}
	if (d) {
		this.Direction = d.clone();
	}
	if (c) {
		this.Speed = c;
	}
	this.init();
};
CL3D.AnimatorFlyCircle.prototype = new CL3D.Animator();
CL3D.AnimatorFlyCircle.prototype.getType = function () {
	return "flycircle";
};
CL3D.AnimatorFlyCircle.prototype.animateNode = function (e, d) {
	var c = (d - this.StartTime);
	if (c != 0) {
		var b = c * this.Speed;
		var a = this.VecU.multiplyWithScal(Math.cos(b)).add(this.VecV.multiplyWithScal(Math.sin(b)));
		a.multiplyThisWithScal(this.Radius);
		e.Pos = this.Center.add(a);
		return true;
	}
	return false;
};
CL3D.AnimatorFlyCircle.prototype.init = function () {
	this.Direction.normalize();
	if (this.Direction.Y != 0) {
		this.VecV = new CL3D.Vect3d(50, 0, 0);
		this.VecV = this.VecV.crossProduct(this.Direction);
		this.VecV.normalize();
	} else {
		this.VecV = new CL3D.Vect3d(0, 50, 0);
		this.VecV = this.VecV.crossProduct(this.Direction);
		this.VecV.normalize();
	}
	this.VecU = this.VecV.crossProduct(this.Direction);
	this.VecU.normalize();
};
CL3D.AnimatorRotation = function (a) {
	this.Rotation = new CL3D.Vect3d();
	if (a) {
		this.Rotation = a.clone();
	}
	this.StartTime = CL3D.CLTimer.getTime();
	this.RotateToTargetAndStop = false;
	this.RotateToTargetEndTime = 0;
	this.BeginRotation = null;
};
CL3D.AnimatorRotation.prototype = new CL3D.Animator();
CL3D.AnimatorRotation.prototype.getType = function () {
	return "rotation";
};
CL3D.AnimatorRotation.prototype.animateNode = function (g, f) {
	var c = f - this.StartTime;
	if (!this.RotateToTargetAndStop) {
		if (c != 0) {
			g.Rot.addToThis(this.Rotation.multiplyWithScal(c / 10));
			this.StartTime = f;
			return true;
		}
	} else {
		if (this.RotateToTargetEndTime - this.StartTime == 0) {
			return false;
		}
		var e = (f - this.StartTime) / (this.RotateToTargetEndTime - this.StartTime);
		if (e > 1) {
			g.removeAnimator(this);
		} else {
			var a = new CL3D.Quaternion();
			var b = this.Rotation.multiplyWithScal(CL3D.DEGTORAD);
			a.setFromEuler(b.X, b.Y, b.Z);
			var d = new CL3D.Quaternion();
			var b = this.BeginRotation.multiplyWithScal(CL3D.DEGTORAD);
			d.setFromEuler(b.X, b.Y, b.Z);
			d.slerp(d, a, e);
			b = new CL3D.Vect3d();
			d.toEuler(b);
			b.multiplyThisWithScal(CL3D.RADTODEG);
			g.Rot = b;
			return true;
		}
	}
	return false;
};
CL3D.AnimatorRotation.prototype.setRotateToTargetAndStop = function (b, a, c) {
	this.RotateToTargetAndStop = true;
	this.Rotation = b.clone();
	this.BeginRotation = a.clone();
	this.RotateToTargetEndTime = this.StartTime + c;
};
CL3D.AnimatorAnimateTexture = function (a, c, b) {
	this.Textures = new Array();
	this.Loop = true;
	this.TimePerFrame = 20;
	this.TextureChangeType = 0;
	this.TextureIndexToChange = 0;
	this.MyStartTime = 0;
	if (a) {
		this.Textures = a;
	}
	if (c) {
		this.TimePerFrame = c;
	}
	if (b == true) {
		this.loop = false;
	}
};
CL3D.AnimatorAnimateTexture.prototype = new CL3D.Animator();
CL3D.AnimatorAnimateTexture.prototype.getType = function () {
	return "animatetexture";
};
CL3D.AnimatorAnimateTexture.prototype.animateNode = function (c, a) {
	if (c == null || this.Textures == null) {
		return false;
	}
	var d = false;
	var h = null;
	if (this.Textures.length) {
		var b = (this.MyStartTime == 0) ? c.scene.getStartTime() : this.MyStartTime;
		var j = (a - b);
		var f = b + (this.TimePerFrame * this.Textures.length);
		var g = 0;
		if (!this.Loop && a >= f) {
			g = this.Textures.length - 1;
		} else {
			if (this.TimePerFrame > 0) {
				g = Math.floor((j / this.TimePerFrame) % this.Textures.length);
			} else {
				g = 0;
			}
		}
		if (g < this.Textures.length) {
			if (this.TextureChangeType == 1) {
				if (this.TextureIndexToChange >= 0 && this.TextureIndexToChange < c.getMaterialCount()) {
					h = c.getMaterial(this.TextureIndexToChange);
					if (h && !(h.Tex1 === this.Textures[g])) {
						h.Tex1 = this.Textures[g];
						d = true;
					}
				};
			} else {
				var k = c.getMaterialCount();
				for (var e = 0; e < k; ++e) {
					h = c.getMaterial(e);
					if (h && !(h.Tex1 === this.Textures[g])) {
						h.Tex1 = this.Textures[g];
						d = true;
					}
				};
			}
		};
	}
	return d;
};
CL3D.AnimatorAnimateTexture.prototype.reset = function () {
	this.MyStartTime = CL3D.CLTimer.getTime();
};
CL3D.AnimatorOnClick = function (d, c, a, b) {
	this.engine = c;
	this.TimeLastClicked = 0;
	this.PositionClickedX = -1;
	this.PositionClickedY = -1;
	this.Registered = false;
	this.LastUsedSceneNode = null;
	this.SMGr = d;
	this.FunctionToCall = a;
	this.BoundingBoxTestOnly = true;
	this.CollidesWithWorld = false;
	this.TheActionHandler = null;
	this.World = null;
	if (!(b == true)) {
		d.registerSceneNodeAnimatorForEvents(this);
	}
};
CL3D.AnimatorOnClick.prototype = new CL3D.Animator();
CL3D.AnimatorOnClick.prototype.getType = function () {
	return "onclick";
};
CL3D.AnimatorOnClick.prototype.animateNode = function (d, c) {
	if (d == null) {
		return false;
	}
	if (this.TimeLastClicked) {
		var a = CL3D.CLTimer.getTime();
		var b = a - this.TimeLastClicked;
		if (b < 1500) {
			this.TimeLastClicked = 0;
			if (d.Visible && this.isOverNode(d, this.PositionClickedX, this.PositionClickedY)) {
				if (this.FunctionToCall) {
					this.FunctionToCall();
				}
				this.invokeAction(d);
				return true;
			}
		};
	}
	return false;
};
CL3D.AnimatorOnClick.prototype.onMouseUp = function (a) {
	this.PositionClickedX = this.engine.getMousePosXFromEvent(a);
	this.PositionClickedY = this.engine.getMousePosYFromEvent(a);
	this.TimeLastClicked = CL3D.CLTimer.getTime();
};
CL3D.AnimatorOnClick.prototype.invokeAction = function (a) {
	if (this.TheActionHandler) {
		this.TheActionHandler.execute(a);
	}
};
CL3D.AnimatorOnClick.prototype.isOverNode = function (g, f, d) {
	if (g == null) {
		return false;
	}
	if (g.getType() == "2doverlay") {
		var e = g.getScreenCoordinatesRect(false, this.engine.getRenderer());
		if (e.x <= f && e.y <= d && e.x + e.w >= f && e.y + e.h >= d) {
			return true;
		}
	}
	var b = this.engine.get3DPositionFrom2DPosition(f, d);
	if (b == null) {
		return false;
	}
	var h = this.SMGr.getActiveCamera();
	if (h == null) {
		return false;
	}
	var c = h.getAbsolutePosition();
	var a = new CL3D.Line3d();
	a.Start = c;
	a.End = b;
	return this.static_getCollisionDistanceWithNode(this.SMGr, g, a, this.BoundingBoxTestOnly, this.CollidesWithWorld, this.World, null);
};
CL3D.AnimatorOnClick.prototype.static_getDistanceToNearestCollisionPointWithWorld = function (c, d, b, f) {
	var e = 999999999999;
	if (!f || !c) {
		return e;
	}
	var a = f.getCollisionPointWithLine(d, b, true);
	if (a) {
		return d.getDistanceTo(a);
	}
	return e;
};
CL3D.AnimatorOnClick.prototype.getDistanceToNearestCollisionPointWithWorld = function (b, a) {
	return this.static_getDistanceToNearestCollisionPointWithWorld(this.SMGr, b, a, this.World);
};
CL3D.AnimatorOnClick.prototype.static_getCollisionDistanceWithNode = function (a, k, g, d, e, j, l) {
	var f = k.getBoundingBox();
	var c = 0;
	var r = new CL3D.Matrix4(false);
	if (k.AbsoluteTransformation.getInverse(r)) {
		if (f.intersectsWithLine(r.getTransformedVect(g.Start), r.getTransformedVect(g.End))) {
			var q = null;
			if (k.getMesh && k.OwnedMesh) {
				q = k;
			}
			var o = (q == null) || d;
			if (!o) {
				var m = q.Selector;
				if (m == null) {
					m = new CL3D.MeshTriangleSelector(q.OwnedMesh, q);
					q.Selector = m;
				}
				if (m) {
					var b = m.getCollisionPointWithLine(g.Start, g.End, true);
					if (b != null) {
						if (e) {
							c = this.static_getDistanceToNearestCollisionPointWithWorld(a, g.Start, b, j);
							if (c + CL3D.TOLERANCE < b.getDistanceTo(g.Start)) {
								return false;
							} else {
								if (l != null) {
									l.N = b.getDistanceTo(g.Start);
								}
								return true;
							}
						} else {
							if (l != null) {
								l.N = g.Start.getDistanceTo(k.getTransformedBoundingBox().getCenter());
							}
							return true;
						}
					};
				} else {
					o = true;
				}
			}
			if (o) {
				if (!e) {
					if (l != null) {
						l.N = g.Start.getDistanceTo(k.getTransformedBoundingBox().getCenter());
					}
					return true;
				} else {
					var t = g.Start.clone();
					f = k.getTransformedBoundingBox();
					var s = f.getExtent();
					s.multiplyThisWithScal(0.5);
					var p = CL3D.max3(s.X, s.Y, s.Z);
					p = Math.sqrt((p * p) + (p * p));
					var n = k.getTransformedBoundingBox().getCenter();
					c = this.static_getDistanceToNearestCollisionPointWithWorld(a, t, n, j);
					var h = n.getDistanceTo(t) - p;
					if (c < h) {
						return false;
					} else {
						if (l != null) {
							l.N = h;
						}
						return true;
					}
				};
			}
		};
	}
	return false;
};
CL3D.AnimatorOnMove = function (b, a) {
	this.engine = a;
	this.SMGr = b;
	this.ActionHandlerOnEnter = null;
	this.ActionHandlerOnLeave = null;
	this.TimeLastChecked = 0;
	this.bLastTimeWasInside = 0;
};
CL3D.AnimatorOnMove.prototype = new CL3D.AnimatorOnClick(null, null, null, true);
CL3D.AnimatorOnMove.prototype.getType = function () {
	return "onmove";
};
CL3D.AnimatorOnMove.prototype.animateNode = function (b, e) {
	var d = (this.TimeLastChecked == 0);
	var a = CL3D.CLTimer.getTime();
	if (d || a - this.TimeLastChecked > 200) {
		this.TimeLastChecked = a;
		var c = this.isOverNode(b, this.engine.getMouseX(), this.engine.getMouseY());
		if (d) {
			this.bLastTimeWasInside = c;
		} else {
			if (c != this.bLastTimeWasInside) {
				this.bLastTimeWasInside = c;
				if (c && this.ActionHandlerOnEnter) {
					this.ActionHandlerOnEnter.execute(b);
				} else {
					if (!c && this.ActionHandlerOnLeave) {
						this.ActionHandlerOnLeave.execute(b);
					}
				}
				return true;
			}
		};
	}
	return false;
};
CL3D.AnimatorOnProximity = function (e, c, b, d, a) {
	this.TimeLastClicked = 0;
	this.sceneManager = e;
	this.EnterType = 0;
	this.ProximityType = 0;
	this.Range = 0;
	this.SceneNodeToTest = 0;
	this.TheActionHandler = 0;
	this.FunctionToCall = d;
	if (c) {
		this.Radius = c;
	}
	if (b) {
		this.SceneNodeToTest = b;
	}
	if (a) {
		this.EnterType = EPET_LEAVE;
	}
	this.IsInsideRadius = false;
};
CL3D.AnimatorOnProximity.prototype = new CL3D.Animator();
CL3D.AnimatorOnProximity.prototype.getType = function () {
	return "oncollide";
};
CL3D.AnimatorOnProximity.prototype.animateNode = function (g, f) {
	if (g == null || this.sceneManager == null) {
		return false;
	}
	var e = false;
	var a = null;
	if (this.ProximityType == 0) {
		a = this.sceneManager.getActiveCamera();
	} else {
		if (this.SceneNodeToTest != -1) {
			a = this.sceneManager.getSceneNodeFromId(this.SceneNodeToTest);
		}
	}
	if (a) {
		if (g === a) {
			return false;
		}
		var c = a.getAbsolutePosition();
		var b = g.getAbsolutePosition();
		var d = c.getDistanceTo(b) < this.Range;
		switch (this.EnterType) {
		case 0:
			if (d && !this.IsInsideRadius) {
				this.invokeAction(a);
				e = true;
			}
			break;
		case 1:
			if (!d && this.IsInsideRadius) {
				this.invokeAction(a);
				e = true;
			}
			break;
		}
		this.IsInsideRadius = d;
	}
	return e;
};
CL3D.AnimatorOnProximity.prototype.invokeAction = function (a) {
	if (this.TheActionHandler) {
		this.TheActionHandler.execute(a);
	}
};
CL3D.AnimatorCollisionResponse = function (a, e, d, c, b) {
	this.Radius = a;
	this.Gravity = e;
	this.Translation = d;
	this.World = c;
	this.SlidingSpeed = b;
	this.Node = null;
	this.LastAnimationTime = null;
	this.LastPosition = new CL3D.Vect3d(0, 0, 0);
	this.Falling = false;
	this.FallStartTime = 0;
	this.JumpForce = 0;
	if (this.Gravity == null) {
		this.Gravity = new CL3D.Vect3d(0, 1, 0);
	}
	if (this.Radius == null) {
		this.Radius = new CL3D.Vect3d(30, 50, 30);
	}
	if (this.Translation == null) {
		this.Translation = new CL3D.Vect3d(0, 0, 0);
	}
	if (this.SlidingSpeed == null) {
		this.SlidingSpeed = 0.0005;
	}
	this.reset();
};
CL3D.AnimatorCollisionResponse.prototype = new CL3D.Animator();
CL3D.AnimatorCollisionResponse.prototype.getType = function () {
	return "collisionresponse";
};
CL3D.AnimatorCollisionResponse.prototype.reset = function () {
	this.Node = null;
	this.LastAnimationTime = CL3D.CLTimer.getTime();
};
CL3D.AnimatorCollisionResponse.prototype.setWorld = function (a) {
	this.World = a;
};
CL3D.AnimatorCollisionResponse.prototype.getWorld = function () {
	return this.World;
};
CL3D.AnimatorCollisionResponse.prototype.setGravity = function (a) {
	this.Gravity = a;
};
CL3D.AnimatorCollisionResponse.prototype.getGravity = function () {
	return this.Gravity;
};
CL3D.AnimatorCollisionResponse.prototype.isFalling = function () {
	return this.Falling;
};
CL3D.AnimatorCollisionResponse.prototype.animateNode = function (f, e) {
	var m = (e - this.LastAnimationTime);
	if (!this.World) {
		return false;
	}
	if (m > 150) {
		m = 150;
	}
	this.LastAnimationTime = e;
	if (!(this.Node === f)) {
		this.Node = f;
		this.LastPosition = f.Pos.clone();
	}
	var p = f.Pos.clone();
	var r = f.Pos.substract(this.LastPosition);
	var g = this.Gravity.multiplyWithScal(m);
	if (!this.Falling) {
		g.multiplyThisWithScal(0.001);
	} else {
		var t = ((e - this.FallStartTime) / 1000);
		if (t > 5) {
			t = 5;
		}
		g.multiplyThisWithScal(t);
	}
	if (this.JumpForce > 0) {
		var k = this.Gravity.multiplyWithScal(m * this.JumpForce * 0.001);
		g.substractFromThis(k);
		this.JumpForce -= m;
		if (this.JumpForce < 0) {
			this.JumpForce = 0;
		}
	}
	var c = r.add(g);
	if (!c.equalsZero()) {
		this.SlidingSpeed = this.Radius.getLength() * 0.000001;
		var b = null;
		if (f && f.getType() == "camera") {
			b = f;
		}
		var o;
		if (b) {
			o = b.Target.substract(b.Pos);
		}
		var l = new CL3D.Triangle3d();
		var d = new Object();
		d.N = 0;
		p = this.getCollisionResultPosition(this.World, this.LastPosition.substract(this.Translation), this.Radius, r, this.triangle, d, this.SlidingSpeed, g);
		p.addToThis(this.Translation);
		if (d.N < 0.5) {
			this.Falling = false;
		} else {
			if (!this.Falling) {
				this.FallStartTime = e;
			}
			this.Falling = true;
		}
		if (f.Pos.equals(p)) {
			return false;
		}
		f.Pos = p.clone();
		if (b && o) {
			var s = true;
			for (var j = 0; j < f.Animators.length; ++j) {
				var q = f.Animators[j];
				if (q && q.getType() == "cameramodelviewer") {
					s = false;
					break;
				}
			}
			if (s) {
				b.Target = f.Pos.add(o);
			}
		};
	}
	var h = this.LastPosition.equals(f.Pos);
	this.LastPosition = f.Pos.clone();
	return false;
};
CL3D.AnimatorCollisionResponse.prototype.getCollisionResultPosition = function (c, e, h, d, k, g, b, n) {
	if (!c || h.X == 0 || h.Y == 0 || h.Z == 0) {
		return e;
	}
	var a = new Object();
	a.R3Position = e.clone();
	a.R3Velocity = d.clone();
	a.eRadius = h.clone();
	a.nearestDistance = 99999999.9;
	a.selector = c;
	a.slidingSpeed = b;
	a.triangleHits = 0;
	a.intersectionPoint = new CL3D.Vect3d();
	var l = a.R3Position.divideThroughVect(a.eRadius);
	var m = a.R3Velocity.divideThroughVect(a.eRadius);
	var f = this.collideWithWorld(0, a, l, m);
	g.N = 0;
	if (!n.equalsZero()) {
		a.R3Position = f.multiplyWithVect(a.eRadius);
		a.R3Velocity = n.clone();
		a.triangleHits = 0;
		m = n.divideThroughVect(a.eRadius);
		f = this.collideWithWorld(0, a, f, m);
		g.N = (a.triangleHits == 0) ? 1 : 0;
		if (g.N < 0.5 && a.intersectionTriangle) {
			var j = a.intersectionTriangle.getNormal();
			j.normalize();
			if (!(Math.abs(j.Y) > Math.abs(j.X) && Math.abs(j.Y) > Math.abs(j.Z))) {
				g.N = 1;
			}
		};
	}
	if (a.triangleHits) {
		k = a.intersectionTriangle;
		k.pointA.multiplyThisWithVect(a.eRadius);
		k.pointB.multiplyThisWithVect(a.eRadius);
		k.pointC.multiplyThisWithVect(a.eRadius);
	}
	f.multiplyThisWithVect(a.eRadius);
	return f;
};
CL3D.AnimatorCollisionResponse.prototype.collideWithWorld = function (l, c, k, m) {
	var p = c.slidingSpeed;
	if (l > 5) {
		return k.clone();
	}
	c.velocity = m.clone();
	c.normalizedVelocity = m.clone();
	c.normalizedVelocity.normalize();
	c.basePoint = k.clone();
	c.foundCollision = false;
	c.nearestDistance = 99999999.9;
	var h = new CL3D.Box3d();
	c.R3Position.copyTo(h.MinEdge);
	c.R3Position.copyTo(h.MaxEdge);
	h.addInternalPointByVector(c.R3Position.add(c.R3Velocity));
	h.MinEdge.substractFromThis(c.eRadius);
	h.MaxEdge.addToThis(c.eRadius);
	var e = new Array();
	var o = new CL3D.Matrix4();
	o.setScaleXYZ(1 / c.eRadius.X, 1 / c.eRadius.Y, 1 / c.eRadius.Z);
	c.selector.getTrianglesInBox(h, o, e);
	for (var g = 0; g < e.length; ++g) {
		this.testTriangleIntersection(c, e[g]);
	}
	if (!c.foundCollision) {
		return k.add(m);
	}
	var a = k.add(m);
	var r = k.clone();
	if (c.nearestDistance >= p) {
		var n = m.clone();
		n.setLength(c.nearestDistance - p);
		r = c.basePoint.add(n);
		n.normalize();
		c.intersectionPoint.substractFromThis(n.multiplyWithScal(p));
	}
	var b = c.intersectionPoint.clone();
	var q = r.substract(c.intersectionPoint);
	q.normalize();
	var j = new CL3D.Plane3d();
	j.setPlane(b, q);
	var d = a.substract(q.multiplyWithScal(j.getDistanceTo(a)));
	var f = d.substract(c.intersectionPoint);
	if (f.getLength() < p) {
		return r;
	}
	return this.collideWithWorld(l + 1, c, r, f);
};
CL3D.AnimatorCollisionResponse.prototype.testTriangleIntersection = function (u, z) {
	var v = z.getPlane();
	if (!v.isFrontFacing(u.normalizedVelocity)) {
		return;
	}
	var o = 0;
	var q = 0;
	var k = false;
	var A = 0;
	var p = v.getDistanceTo(u.basePoint);
	var G = v.Normal.dotProduct(u.velocity);
	if (CL3D.iszero(G)) {
		if (Math.abs(p) >= 1) {
			return;
		} else {
			k = true;
			q = 0;
			o = 1;
		}
	} else {
		G = 1 / G;
		q = (-1 - p) * G;
		o = (1 - p) * G;
		if (q > o) {
			var C = o;
			o = q;
			q = C;
		}
		if (q > 1 || o < 0) {
			return;
		}
		q = CL3D.clamp(q, 0, 1);
		o = CL3D.clamp(o, 0, 1);
	}
	var d = new CL3D.Vect3d();
	var l = false;
	var s = 1;
	if (!k) {
		var w = (u.basePoint.substract(v.Normal)).add(u.velocity.multiplyWithScal(q));
		if (z.isPointInsideFast(w)) {
			l = true;
			s = q;
			d = w.clone();
		}
	}
	if (!l) {
		var m = u.velocity.clone();
		var g = u.basePoint.clone();
		var y = m.getLengthSQ();
		var F = 0;
		var D = 0;
		var B = 0;
		var r = new Object();
		r.N = 0;
		F = y;
		D = 2 * (m.dotProduct(g.substract(z.pointA)));
		B = (z.pointA.substract(g)).getLengthSQ() - 1;
		if (this.getLowestRoot(F, D, B, s, r)) {
			s = r.N;
			l = true;
			d = z.pointA.clone();
		}
		if (!l) {
			D = 2 * (m.dotProduct(g.substract(z.pointB)));
			B = (z.pointB.substract(g)).getLengthSQ() - 1;
			if (this.getLowestRoot(F, D, B, s, r)) {
				s = r.N;
				l = true;
				d = z.pointB.clone();
			}
		}
		if (!l) {
			D = 2 * (m.dotProduct(g.substract(z.pointC)));
			B = (z.pointC.substract(g)).getLengthSQ() - 1;
			if (this.getLowestRoot(F, D, B, s, r)) {
				s = r.N;
				l = true;
				d = z.pointC.clone();
			}
		}
		var j = z.pointB.substract(z.pointA);
		var x = z.pointA.substract(g);
		var n = j.getLengthSQ();
		var h = j.dotProduct(m);
		var e = j.dotProduct(x);
		F = n * -y + h * h;
		D = n * (2 * m.dotProduct(x)) - 2 * h * e;
		B = n * (1 - x.getLengthSQ()) + e * e;
		if (this.getLowestRoot(F, D, B, s, r)) {
			A = (h * r.N - e) / n;
			if (A >= 0 && A <= 1) {
				s = r.N;
				l = true;
				d = z.pointA.add(j.multiplyWithScal(A));
			}
		}
		j = z.pointC.substract(z.pointB);
		x = z.pointB.substract(g);
		n = j.getLengthSQ();
		h = j.dotProduct(m);
		e = j.dotProduct(x);
		F = n * -y + h * h;
		D = n * (2 * m.dotProduct(x)) - 2 * h * e;
		B = n * (1 - x.getLengthSQ()) + e * e;
		if (this.getLowestRoot(F, D, B, s, r)) {
			A = (h * r.N - e) / n;
			if (A >= 0 && A <= 1) {
				s = r.N;
				l = true;
				d = z.pointB.add(j.multiplyWithScal(A));
			}
		}
		j = z.pointA.substract(z.pointC);
		x = z.pointC.substract(g);
		n = j.getLengthSQ();
		h = j.dotProduct(m);
		e = j.dotProduct(x);
		F = n * -y + h * h;
		D = n * (2 * m.dotProduct(x)) - 2 * h * e;
		B = n * (1 - x.getLengthSQ()) + e * e;
		if (this.getLowestRoot(F, D, B, s, r)) {
			A = (h * r.N - e) / n;
			if (A >= 0 && A <= 1) {
				s = r.N;
				l = true;
				d = z.pointC.add(j.multiplyWithScal(A));
			}
		};
	}
	if (l) {
		var E = s * u.velocity.getLength();
		if (!u.foundCollision || E < u.nearestDistance) {
			u.nearestDistance = E;
			u.intersectionPoint = d.clone();
			u.foundCollision = true;
			u.intersectionTriangle = z;
			++u.triangleHits;
		}
	};
};
CL3D.AnimatorCollisionResponse.prototype.getLowestRoot = function (m, l, j, g, d) {
	var k = l * l - (4 * m * j);
	if (k < 0) {
		return false;
	}
	var n = Math.sqrt(k);
	var f = (-l - n) / (2 * m);
	var e = (-l + n) / (2 * m);
	if (f > e) {
		var h = e;
		e = f;
		f = h;
	}
	if (f > 0 && f < g) {
		d.N = f;
		return true;
	}
	if (e > 0 && e < g) {
		d.N = e;
		return true;
	}
	return false;
};
CL3D.AnimatorCollisionResponse.prototype.jump = function (a) {
	this.JumpForce = a * 100;
};
CL3D.AnimatorTimer = function (a) {
	this.TimeLastTimed = 0;
	this.SMGr = a;
	this.TheActionHandler = null;
	this.TickEverySeconds = 0;
	this.TimeLastTimed = CL3D.CLTimer.getTime();
};
CL3D.AnimatorTimer.prototype = new CL3D.Animator();
CL3D.AnimatorTimer.prototype.getType = function () {
	return "timer";
};
CL3D.AnimatorTimer.prototype.animateNode = function (c, b) {
	if (c == null) {
		return false;
	}
	if (this.TickEverySeconds > 0) {
		var a = CL3D.CLTimer.getTime();
		if (a - this.TimeLastTimed > this.TickEverySeconds) {
			this.TimeLastTimed = a;
			if (this.TheActionHandler) {
				this.TheActionHandler.execute(c);
			}
			return true;
		}
	}
	return false;
};
CL3D.AnimatorOnKeyPress = function (b, a) {
	this.SMGr = b;
	this.TheActionHandler = null;
	this.TickEverySeconds = 0;
	this.TimeLastPressed = 0;
	a.registerAnimatorForKeyUp(this);
	a.registerAnimatorForKeyDown(this);
	b.registerSceneNodeAnimatorForEvents(this);
};
CL3D.AnimatorOnKeyPress.prototype = new CL3D.Animator();
CL3D.AnimatorOnKeyPress.prototype.getType = function () {
	return "keypress";
};
CL3D.AnimatorOnKeyPress.prototype.animateNode = function (d, c) {
	if (d == null) {
		return false;
	}
	if (this.TimeLastPressed) {
		var a = CL3D.CLTimer.getTime();
		var b = a - this.TimeLastPressed;
		if (b < 1000) {
			this.TimeLastPressed = 0;
			if (this.TheActionHandler) {
				this.TheActionHandler.execute(d);
			}
			return true;
		}
	}
	return false;
};
CL3D.AnimatorOnKeyPress.prototype.onKeyDown = function (a) {
	if (this.KeyPressType == 0 && a.keyCode == this.KeyCode) {
		this.TimeLastPressed = CL3D.CLTimer.getTime();
	}
};
CL3D.AnimatorOnKeyPress.prototype.onKeyUp = function (a) {
	if (this.KeyPressType == 1 && a.keyCode == this.KeyCode) {
		this.TimeLastPressed = CL3D.CLTimer.getTime();
	}
};
CL3D.AnimatorOnKeyPress.prototype.onMouseUp = function (a) {
	if (this.KeyPressType == 1) {
		if (a.button > 1 && this.KeyCode == 2) {
			this.TimeLastPressed = CL3D.CLTimer.getTime();
		} else {
			if (a.button <= 1 && this.KeyCode == 1) {
				this.TimeLastPressed = CL3D.CLTimer.getTime();
			}
		};
	}
};
CL3D.AnimatorOnKeyPress.prototype.onMouseDown = function (a) {
	if (this.KeyPressType == 0) {
		if (a.button > 1 && this.KeyCode == 2) {
			this.TimeLastPressed = CL3D.CLTimer.getTime();
		} else {
			if (a.button <= 1 && this.KeyCode == 1) {
				this.TimeLastPressed = CL3D.CLTimer.getTime();
			}
		};
	}
};
CL3D.AnimatorGameAI = function (b, a) {
	this.AIType = 0;
	this.MovementSpeed = 0;
	this.ActivationRadius = 0;
	this.CanFly = false;
	this.Health = 100;
	this.Tags = "";
	this.AttacksAIWithTags = "";
	this.PatrolRadius = 100;
	this.RotationSpeedMs = 0;
	this.AdditionalRotationForLooking = new CL3D.Vect3d();
	this.StandAnimation = "";
	this.WalkAnimation = "";
	this.DieAnimation = "";
	this.AttackAnimation = "";
	this.ActionHandlerOnAttack = null;
	this.ActionHandlerOnActivate = null;
	this.ActionHandlerOnHit = null;
	this.ActionHandlerOnDie = null;
	this.CurrentCommand = 0;
	this.NextAttackTargetScanTime = 0;
	this.LastPatrolStartTime = 0;
	this.CurrentCommandTargetPos = null;
	this.CurrentCommandStartTime = 0;
	this.CurrentCommandTicksDone = 0;
	this.CurrentCommandExpectedTickCount = 0;
	this.BeginPositionWhenStartingCurrentCommand = 0;
	this.HandleCurrentCommandTargetNode = null;
	this.AttackCommandExecuted = false;
	this.Activated = false;
	this.CurrentlyShooting = false;
	this.CurrentlyShootingLine = new CL3D.Line3d();
	this.World = null;
	this.TheObject = null;
	this.TheSceneManager = b;
	this.LastTime = 0;
	this.StartPositionOfActor = new CL3D.Vect3d();
	this.NearestSceneNodeFromAIAnimator_NodeOut = null;
	this.NearestSceneNodeFromAIAnimator_maxDistance = 0;
};
CL3D.AnimatorGameAI.prototype = new CL3D.Animator();
CL3D.AnimatorGameAI.prototype.getType = function () {
	return "gameai";
};
CL3D.AnimatorGameAI.prototype.animateNode = function (c, b) {
	if (c == null || this.TheSceneManager == null) {
		return false;
	}
	var m = b - this.LastTime;
	if (m > 150) {
		m = 150;
	}
	this.LastTime = b;
	var p = 0;
	var n = false;
	if (!(this.TheObject === c)) {
		this.TheObject = c;
		c.updateAbsolutePosition();
		this.StartPositionOfActor = c.getAbsolutePosition();
	}
	var j = c.getAbsolutePosition();
	if (this.CurrentCommand == 3) {} else {
		if (this.CurrentCommand == 1) {
			p = this.getCharacterWidth(c);
			if (this.CurrentCommandTargetPos.substract(j).getLength() < p) {
				this.CurrentCommand = 0;
				this.setAnimation(c, 0);
				n = true;
			} else {
				var g = false;
				if (this.CurrentCommandTicksDone > 2) {
					var a = this.CurrentCommandTicksDone * (this.MovementSpeed / 1000);
					var h = this.BeginPositionWhenStartingCurrentCommand.substract(j).getLength();
					if (h * 2 < a) {
						this.CurrentCommand = 0;
						g = true;
					}
				}
				if (!g) {
					this.CurrentCommandTicksDone += m;
					var d = this.CurrentCommandTargetPos.substract(j);
					d.setLength((this.MovementSpeed / 1000) * m);
					c.Pos.addToThis(d);
				}
				n = this.animateRotation(c, (b - this.CurrentCommandStartTime), this.CurrentCommandTargetPos.substract(j), this.RotationSpeedMs);
			}
		} else {
			if (this.CurrentCommand == 2) {
				this.CurrentCommandTicksDone += m;
				if (!this.AttackCommandExecuted && this.CurrentCommandTicksDone > (this.CurrentCommandExpectedTickCount / 2)) {
					this.CurrentlyShooting = true;
					if (this.ActionHandlerOnAttack) {
						this.ActionHandlerOnAttack.execute(c);
					}
					this.CurrentlyShooting = false;
					this.AttackCommandExecuted = true;
					n = true;
				}
				if (this.CurrentCommandTicksDone > this.CurrentCommandExpectedTickCount) {
					this.CurrentCommand = 0;
				} else {
					n = this.animateRotation(c, (b - this.CurrentCommandStartTime), this.CurrentCommandTargetPos.substract(j), Math.min(this.RotationSpeedMs, this.CurrentCommandExpectedTickCount));
				}
			} else {
				if (this.CurrentCommand == 0) {
					if (this.AIType == 1 || this.AIType == 2) {
						var l = this.scanForAttackTargetIfNeeded(b, j);
						if (l != null) {
							var o = this.getAttackDistanceFromWeapon();
							if (!this.Activated && this.ActionHandlerOnActivate) {
								this.ActionHandlerOnActivate.execute(c);
							}
							this.Activated = true;
							n = true;
							if (l.getAbsolutePosition().getDistanceTo(j) < o) {
								if (this.isNodeVisibleFromNode(l, c)) {
									this.CurrentlyShootingLine.Start = c.getTransformedBoundingBox().getCenter();
									this.CurrentlyShootingLine.End = l.getTransformedBoundingBox().getCenter();
									this.attackTarget(c, l, l.getAbsolutePosition(), j, b);
								} else {
									this.moveToTarget(c, l.getAbsolutePosition(), j, b);
								}
							} else {
								this.moveToTarget(c, l.getAbsolutePosition(), j, b);
							}
						} else {
							if (this.AIType == 2) {
								var f = 10000;
								if (this.MovementSpeed) {
									f = this.PatrolRadius / (this.MovementSpeed / 1000);
								}
								if (!this.LastPatrolStartTime || b > this.LastPatrolStartTime + f) {
									var e = this.PatrolRadius;
									this.LastPatrolStartTime = b;
									var k = new CL3D.Vect3d((Math.random() - 0.5) * e, (Math.random() - 0.5) * e, (Math.random() - 0.5) * e);
									k.addToThis(this.StartPositionOfActor);
									if (!this.CanFly) {
										k.Y = this.StartPositionOfActor.Y;
									}
									p = this.getCharacterWidth(c);
									if (!(k.substract(j).getLength() < p)) {
										this.moveToTarget(c, k, j, b);
										n = true;
									}
								};
							}
						};
					}
				};
			}
		};
	}
	return n;
};
CL3D.AnimatorGameAI.prototype.animateRotation = function (c, k, h, a) {
	if (!c) {
		return false;
	}
	var b = (c.getType() == "camera");
	if (b) {
		return false;
	}
	if (!this.CanFly) {
		h.Y = 0;
	}
	var j = new CL3D.Matrix4();
	j.setRotationDegrees(h.getHorizontalAngle());
	var g = new CL3D.Matrix4();
	g.setRotationDegrees(this.AdditionalRotationForLooking);
	j = j.multiply(g);
	var f = j.getRotationDegrees();
	var m = c.Rot.clone();
	var l = Math.min(k, a) / a;
	l = CL3D.clamp(l, 0, 1);
	f.multiplyThisWithScal(CL3D.DEGTORAD);
	m.multiplyThisWithScal(CL3D.DEGTORAD);
	var e = new CL3D.Quaternion();
	e.setFromEuler(f.X, f.Y, f.Z);
	var d = new CL3D.Quaternion();
	d.setFromEuler(m.X, m.Y, m.Z);
	d.slerp(d, e, l);
	d.toEuler(f);
	f.multiplyThisWithScal(CL3D.RADTODEG);
	if (c.Rot.equals(f)) {
		return false;
	}
	c.Rot = f;
	return true;
};
CL3D.AnimatorGameAI.prototype.moveToTarget = function (c, d, b, a) {
	this.CurrentCommand = 1;
	this.CurrentCommandTargetPos = d;
	this.CurrentCommandStartTime = a;
	this.BeginPositionWhenStartingCurrentCommand = b;
	this.CurrentCommandTicksDone = 0;
	this.CurrentCommandExpectedTickCount = 0;
	this.setAnimation(c, 1);
};
CL3D.AnimatorGameAI.prototype.attackTarget = function (e, a, f, d, b) {
	this.CurrentCommand = 2;
	this.CurrentCommandTargetPos = f;
	this.CurrentCommandStartTime = b;
	this.HandleCurrentCommandTargetNode = a;
	this.BeginPositionWhenStartingCurrentCommand = d;
	this.CurrentCommandTicksDone = 0;
	this.CurrentCommandExpectedTickCount = 500;
	this.AttackCommandExecuted = false;
	var c = this.setAnimation(e, 2);
	if (c != 0) {
		this.CurrentCommandExpectedTickCount = c;
	}
};
CL3D.AnimatorGameAI.prototype.die = function (d, c, a) {
	this.CurrentCommand = 3;
	this.CurrentCommandStartTime = a;
	this.BeginPositionWhenStartingCurrentCommand = c;
	this.CurrentCommandTicksDone = 0;
	this.CurrentCommandExpectedTickCount = 500;
	var b = this.setAnimation(d, 3);
};
CL3D.AnimatorGameAI.prototype.isNodeVisibleFromNode = function (b, a) {
	if (!b || !a) {
		return false;
	}
	return this.isPositionVisibleFromPosition(b.getTransformedBoundingBox().getCenter(), a.getTransformedBoundingBox().getCenter());
};
CL3D.AnimatorGameAI.prototype.isPositionVisibleFromPosition = function (b, a) {
	if (!this.World || !this.TheSceneManager) {
		return true;
	}
	if (this.World.getCollisionPointWithLine(b, a, true) != null) {
		return false;
	}
	return true;
};
CL3D.AnimatorGameAI.prototype.getNearestSceneNodeFromAIAnimatorAndDistance = function (e, f, a) {
	if (!e || !e.Visible) {
		return;
	}
	var d = false;
	var g = f.getDistanceTo(e.getAbsolutePosition());
	if (g < this.NearestSceneNodeFromAIAnimator_maxDistance) {
		var b = e.getAnimatorOfType("gameai");
		if (b && a != "" && !(b === this) && b.isAlive()) {
			d = b.Tags.indexOf(a) != -1;
		}
	}
	if (d) {
		this.NearestSceneNodeFromAIAnimator_maxDistance = g;
		this.NearestSceneNodeFromAIAnimator_NodeOut = e;
	}
	for (var c = 0; c < e.Children.length; ++c) {
		var h = e.Children[c];
		this.getNearestSceneNodeFromAIAnimatorAndDistance(h, f, a);
	}
};
CL3D.AnimatorGameAI.prototype.scanForAttackTargetIfNeeded = function (b, a) {
	if (this.ActivationRadius <= 0 || !this.TheObject || this.AttacksAIWithTags.length == 0 || !this.TheSceneManager) {
		return null;
	}
	if (!this.NextAttackTargetScanTime || b > this.NextAttackTargetScanTime) {
		this.NearestSceneNodeFromAIAnimator_maxDistance = this.ActivationRadius;
		this.NearestSceneNodeFromAIAnimator_NodeOut = null;
		this.getNearestSceneNodeFromAIAnimatorAndDistance(this.TheSceneManager.getRootSceneNode(), a, this.AttacksAIWithTags);
		this.NextAttackTargetScanTime = b + 500 + (Math.random() * 1000);
		return this.NearestSceneNodeFromAIAnimator_NodeOut;
	}
	return null;
};
CL3D.AnimatorGameAI.prototype.getAttackDistanceFromWeapon = function () {
	var a = 1000;
	if (this.ActionHandlerOnAttack) {
		var b = this.ActionHandlerOnAttack.findAction("Shoot");
		if (b) {
			a = b.getWeaponRange();
		}
	}
	return a;
};
CL3D.AnimatorGameAI.prototype.getCharacterWidth = function (a) {
	if (a != null) {
		return 10;
	}
	var b = a.getTransformedBoundingBox().getExtent();
	b.Y = 0;
	return b.getLength();
};
CL3D.AnimatorGameAI.prototype.getAnimationNameFromType = function (a) {
	switch (a) {
	case 0:
		return this.StandAnimation;
	case 1:
		return this.WalkAnimation;
	case 2:
		return this.AttackAnimation;
	case 3:
		return this.DieAnimation;
	}
	return "";
};
CL3D.AnimatorGameAI.prototype.setAnimation = function (e, d) {
	if (!e || e.getType() != "animatedmesh") {
		return 0;
	}
	var c = e;
	var a = c.Mesh;
	if (!a) {
		return 0;
	}
	var b = a.getNamedAnimationRangeByName(this.getAnimationNameFromType(d));
	if (b) {
		c.setFrameLoop(b.Begin, b.End);
		if (b.FPS != 0) {
			c.setAnimationSpeed(b.FPS);
		}
		c.setLoopMode(d == 1 || d == 0);
		return (b.End - b.Begin) * b.FPS * 1000;
	} else {
		c.setFrameLoop(1, 1);
		c.setLoopMode(false);
	}
	return 0;
};
CL3D.AnimatorGameAI.prototype.isCurrentlyShooting = function () {
	return this.CurrentlyShooting;
};
CL3D.AnimatorGameAI.prototype.getCurrentlyShootingLine = function () {
	return this.CurrentlyShootingLine;
};
CL3D.AnimatorGameAI.prototype.isAlive = function () {
	return this.Health > 0;
};
CL3D.AnimatorGameAI.prototype.OnHit = function (a, b) {
	if (!b) {
		return;
	}
	if (this.Health == 0) {
		return;
	}
	this.Health -= a;
	if (this.Health < 0) {
		this.Health = 0;
	}
	if (this.Health == 0) {
		if (this.ActionHandlerOnDie != null) {
			this.ActionHandlerOnDie.execute(b);
		}
		this.die(b, b.getAbsolutePosition(), 0);
	} else {
		if (this.ActionHandlerOnHit != null) {
			this.ActionHandlerOnHit.execute(b);
		}
	};
};
CL3D.CopperCubeVariables = new Array();
CL3D.CopperCubeVariable = function () {
	this.Name = "";
	this.StringValue = "";
	this.ActiveValueType = 0;
	this.IntValue = 0;
	this.FloatValue = 0;
};
CL3D.CopperCubeVariable.getVariable = function (g, f) {
	if (g == null) {
		return null;
	}
	var e = g.toLowerCase();
	var c = CL3D.CopperCubeVariables;
	for (var d = 0; d < c.length; ++d) {
		var b = c[d];
		if (b != null && b.getName().toLowerCase() == e) {
			return b;
		}
	}
	if (f == true) {
		var a = new CL3D.CopperCubeVariable();
		a.setName(g);
		c.push(a);
		return a;
	}
	return null;
};
CL3D.CopperCubeVariable.prototype.isString = function () {
	return this.ActiveValueType == 0;
};
CL3D.CopperCubeVariable.prototype.isFloat = function () {
	return this.ActiveValueType == 2;
};
CL3D.CopperCubeVariable.prototype.isInt = function () {
	return this.ActiveValueType == 1;
};
CL3D.CopperCubeVariable.prototype.getName = function () {
	return this.Name;
};
CL3D.CopperCubeVariable.prototype.setName = function (a) {
	this.Name = a;
};
CL3D.CopperCubeVariable.prototype.setAsCopy = function (a) {
	if (a == null) {
		return;
	}
	this.ActiveValueType = a.ActiveValueType;
	this.StringValue = a.StringValue;
	this.IntValue = a.IntValue;
	this.FloatValue = a.FloatValue;
};
CL3D.CopperCubeVariable.prototype.getValueAsString = function () {
	switch (this.ActiveValueType) {
	case 1:
		return String(this.IntValue);
	case 2:
		if ((this.FloatValue % 1) == 0) {
			return String(this.FloatValue);
		} else {
			return this.FloatValue.toFixed(6);
		}
	}
	return this.StringValue;
};
CL3D.CopperCubeVariable.prototype.getValueAsInt = function () {
	switch (this.ActiveValueType) {
	case 0:
		return Math.floor(this.StringValue);
	case 1:
		return this.IntValue;
	case 2:
		return this.FloatValue;
	}
	return 0;
};
CL3D.CopperCubeVariable.prototype.getValueAsFloat = function () {
	switch (this.ActiveValueType) {
	case 0:
		return Number(this.StringValue);
	case 1:
		return this.IntValue;
	case 2:
		return this.FloatValue;
	}
	return 0;
};
CL3D.CopperCubeVariable.prototype.setValueAsString = function (a) {
	this.ActiveValueType = 0;
	this.StringValue = a;
};
CL3D.CopperCubeVariable.prototype.setValueAsInt = function (a) {
	this.ActiveValueType = 1;
	this.IntValue = a;
};
CL3D.CopperCubeVariable.prototype.setValueAsFloat = function (a) {
	this.ActiveValueType = 2;
	this.FloatValue = a;
};
startCopperLichtFromFile = function (b, a) {
	var d = new CL3D.CopperLicht(b, true);
	d.load(a);
	return d;
};
CL3D.CopperLicht = function (c, d, b) {
	if ((d == null || d == true) && CL3D.gCCDebugOutput == null) {
		CL3D.gCCDebugOutput = new CL3D.DebugOutput(c);
	}
	this.ElementIdOfCanvas = c;
	this.MainElement = document.getElementById(this.ElementIdOfCanvas);
	this.Document = new CL3D.CCDocument();
	this.TheRenderer = null;
	this.IsPaused = false;
	this.NextCameraToSetActive = null;
	this.TheTextureManager = new CL3D.TextureManager();
	this.LoadingAFile = false;
	this.LoadingAnimationCounter = 0;
	this.FPS = 60;
	this.OnAnimate = null;
	this.OnBeforeDrawAll = null;
	this.OnAfterDrawAll = null;
	this.OnLoadingComplete = null;
	this.RegisteredAnimatorsForKeyUp = new Array();
	this.RegisteredAnimatorsForKeyDown = new Array();
	this.MouseIsDown = false;
	this.MouseX = 0;
	this.MouseY = 0;
	this.MouseDownX = 0;
	this.MouseDownY = 0;
	this.MouseIsInside = true;
	if (b) {
		this.FPS = b;
	}
	var a = this;
	setInterval(function () {
		a.loadingUpdateIntervalHandler();
	}, 500);
};
CL3D.CopperLicht.prototype.initRenderer = function (parameters) {
	return this.createRenderer(parameters);
};
CL3D.CopperLicht.prototype.getRenderer = function () {
	return this.TheRenderer;
};
CL3D.CopperLicht.prototype.getScene = function () {
	if (this.Document == null) {
		return null;
	}
	return this.Document.getCurrentScene();
};
CL3D.CopperLicht.prototype.registerEventHandlers = function () {
	var a = this;
	document.onkeydown = function (c) {
		a.handleKeyDown(c);
	};
	document.onkeyup = function (c) {
		a.handleKeyUp(c);
	};
	var b = this.MainElement;
	if (b != null) {
		b.onmousemove = function (c) {
			a.handleMouseMove(c);
		};
		b.onmousedown = function (c) {
			a.handleMouseDown(c);
		};
		b.onmouseup = function (c) {
			a.handleMouseUp(c);
		};
		b.onmouseover = function (c) {
			a.MouseIsInside = true;
		};
		b.onmouseout = function (c) {
			a.MouseIsInside = false;
		}
	};
};
CL3D.CopperLicht.prototype.load = function (b) {
	if (!this.createRenderer()) {
		return false;
	}
	var c = this;
	this.LoadingAFile = true;
	var a = new CL3D.CCFileLoader(b);
	a.load(function (d) {
		c.parseFile(d, b);
	});
};
CL3D.CopperLicht.prototype.createRenderer = function (parameters) {
	if (this.TheRenderer != null) {
		return true;
	}
	var e = this.MainElement;
	if (e == null) {
		return false;
	}
	var b = e;
	this.TheRenderer = new CL3D.Renderer();
	if (this.TheRenderer.init(b, parameters) == false) {
		return false;
	}
	if (this.TheTextureManager) {
		this.TheTextureManager.TheRenderer = this.TheRenderer;
	}
	this.registerEventHandlers();
	var d = this;
	var a = 1000 / this.FPS;
	setInterval(function () {
		d.draw3DIntervalHandler();
	}, a);
	return true;
};
CL3D.CopperLicht.prototype.draw3DIntervalHandler = function () {
	this.draw3dScene();
};
CL3D.CopperLicht.prototype.loadingUpdateIntervalHandler = function () {
	if (!CL3D.gCCDebugOutput) {
		return;
	}++this.LoadingAnimationCounter;
	var b = 0;
	var c = 0;
	if (this.TheTextureManager) {
		b = this.TheTextureManager.getCountOfTexturesToLoad();
		c = this.TheTextureManager.getTextureCount();
	}
	if (this.LoadingAFile || b) {
		var a = "Loading";
		if (b > 0) {
			a = "Textures loaded: " + (c - b) + " / " + c;
		}
		switch (this.LoadingAnimationCounter % 4) {
		case 0:
			a += ("   ");
			break;
		case 1:
			a += (".  ");
			break;
		case 2:
			a += (".. ");
			break;
		case 3:
			a += ("...");
			break;
		}
		CL3D.gCCDebugOutput.setLoadingText(a);
	} else {
		CL3D.gCCDebugOutput.setLoadingText(null);
	}
};
CL3D.CopperLicht.prototype.isLoading = function (a, b) {
	return this.LoadingAFile;
};
CL3D.CopperLicht.prototype.parseFile = function (b, c) {
	this.LoadingAFile = false;
	var a = new CL3D.FlaceLoader();
	var d = a.loadFile(b, c, this.TheTextureManager, this);
	if (d != null) {
		this.Document = d;
		this.gotoScene(d.getCurrentScene());
		this.draw3dScene();
		if (this.OnLoadingComplete != null) {
			this.OnLoadingComplete();
		}
	};
};
CL3D.CopperLicht.prototype.draw3dScene = function (force) {
	if (this.Document == null || this.TheRenderer == null) {
		return;
	}
	this.internalOnBeforeRendering();
	var a = this.Document.getCurrentScene();
	if ((!this.IsPaused || force) && a) {
		if (this.OnAnimate) {
			this.OnAnimate();
		}
		this.TheRenderer.registerFrame();
		if (a.doAnimate(this.TheRenderer)) {
			this.TheRenderer.beginScene(a.BackgroundColor);
			if (this.OnBeforeDrawAll) {
				this.OnBeforeDrawAll();
			}
			a.drawAll(this.TheRenderer);
			if (this.OnAfterDrawAll) {
				this.OnAfterDrawAll();
			}
			this.TheRenderer.endScene();
		}
	}
	this.internalOnAfterRendering();
};
CL3D.CopperLicht.prototype.internalOnAfterRendering = function () {
	this.setNextCameraActiveIfNeeded();
};
CL3D.CopperLicht.prototype.internalOnBeforeRendering = function () {
	this.setNextCameraActiveIfNeeded();
};
CL3D.CopperLicht.prototype.getScenes = function () {
	if (this.Document) {
		return this.Document.Scenes;
	}
	return 0;
};
CL3D.CopperLicht.prototype.addScene = function (a) {
	if (this.Document) {
		this.Document.Scenes.push(a);
		if (this.Document.Scenes.length == 1) {
			this.Document.setCurrentScene(a);
		}
	};
};
CL3D.CopperLicht.prototype.gotoSceneByName = function (f, e) {
	if (!this.Document) {
		return false;
	}
	var b = this.Document.Scenes;
	var c = f;
	if (e) {
		c = c.toLowerCase();
	}
	for (var d = 0; d < b.length; ++d) {
		var a = b[d].Name;
		if (e) {
			a = a.toLowerCase();
		}
		if (c == a) {
			this.gotoScene(b[d]);
			return;
		}
	};
};
CL3D.CopperLicht.prototype.gotoScene = function (f) {
	if (!f) {
		return false;
	}
	var k = f.getSceneType() == "panorama";
	var l = f.getSceneType() == "free";
	var c = null;
	this.Document.setCurrentScene(f);
	if (f.WasAlreadyActivatedOnce) {
		c = f.getActiveCamera();
	} else {
		f.WasAlreadyActivatedOnce = true;
		var b = false;
		var h = f.getAllSceneNodesOfType("camera");
		if (h) {
			for (var e = 0; e < h.length; ++e) {
				var d = h[e];
				if (d && d.Active) {
					c = d;
					b = true;
					c.setAutoAspectIfNoFixedSet(this.TheRenderer.width, this.TheRenderer.height);
					break;
				}
			};
		}
		if (!b) {
			var a = 4 / 3;
			if (this.TheRenderer.width && this.TheRenderer.height) {
				a = this.TheRenderer.width / this.TheRenderer.height;
			}
			c = new CL3D.CameraSceneNode();
			c.setAspectRatio(a);
			f.RootNode.addChild(c);
			var j = null;
			var g = null;
			if (!k) {
				g = new CL3D.AnimatorCameraFPS(c, this);
				c.addAnimator(g);
			}
			if (l) {
				if (f.DefaultCameraPos != null) {
					c.Pos = f.DefaultCameraPos.clone();
				}
				if (f.DefaultCameraTarget != null) {
					if (g != null) {
						g.lookAt(f.DefaultCameraTarget);
					} else {
						c.setTarget(f.DefaultCameraTarget);
					}
				};
			}
			if (g) {
				g.setMayMove(!k);
			}
		}
		f.setActiveCamera(c);
		f.CollisionWorld = f.createCollisionGeometry(true);
		this.setCollisionWorldForAllSceneNodes(f.getRootSceneNode(), f.CollisionWorld);
	}
	f.setRedrawMode(this.Document.UpdateMode);
	f.forceRedrawNextFrame();
	return true;
};
CL3D.CopperLicht.prototype.setNextCameraActiveIfNeeded = function () {
	if (this.NextCameraToSetActive == null) {
		return;
	}
	var a = this.Document.getCurrentScene();
	if (a == null) {
		return;
	}
	if (this.NextCameraToSetActive.scene === a) {
		if (this.TheRenderer) {
			this.NextCameraToSetActive.setAutoAspectIfNoFixedSet(this.TheRenderer.getWidth(), this.TheRenderer.getHeight());
		}
		a.setActiveCamera(this.NextCameraToSetActive);
		this.NextCameraToSetActive = null;
	}
};
CL3D.CopperLicht.prototype.handleKeyDown = function (b) {
	var d = this.getScene();
	if (d == null) {
		return;
	}
	var c = d.getActiveCamera();
	if (c != null) {
		c.onKeyDown(b);
	}
	for (var a = 0; a < this.RegisteredAnimatorsForKeyUp.length; ++a) {
		this.RegisteredAnimatorsForKeyDown[a].onKeyDown(b);
	}
};
CL3D.CopperLicht.prototype.handleKeyUp = function (b) {
	var d = this.getScene();
	if (d == null) {
		return;
	}
	var c = d.getActiveCamera();
	if (c != null) {
		c.onKeyUp(b);
	}
	for (var a = 0; a < this.RegisteredAnimatorsForKeyUp.length; ++a) {
		this.RegisteredAnimatorsForKeyUp[a].onKeyUp(b);
	}
};
CL3D.CopperLicht.prototype.registerAnimatorForKeyUp = function (a) {
	if (a != null) {
		this.RegisteredAnimatorsForKeyUp.push(a);
	}
};
CL3D.CopperLicht.prototype.registerAnimatorForKeyDown = function (a) {
	if (a != null) {
		this.RegisteredAnimatorsForKeyDown.push(a);
	}
};
CL3D.CopperLicht.prototype.getMousePosXFromEvent = function (a) {
	if (a.offsetX) {
		return a.offsetX;
	} else {
		if (a.layerX) {
			return a.layerX;
		}
	}
	return a.clientX - this.MainElement.offsetLeft + document.body.scrollLeft;
};
CL3D.CopperLicht.prototype.getMousePosYFromEvent = function (a) {
	if (a.offsetX) {
		return a.offsetY;
	} else {
		if (a.layerX) {
			return a.layerY;
		}
	}
	return a.clientY - this.MainElement.offsetTop + document.body.scrollTop;
};
CL3D.CopperLicht.prototype.handleMouseDown = function (a) {
	this.MouseIsDown = true;
	this.MouseButtonDown = a.button;
	this.MouseIsInside = true;
	if (a) {
		this.MouseDownX = this.getMousePosXFromEvent(a);
		this.MouseDownY = this.getMousePosYFromEvent(a);
	}
	var c = this.getScene();
	if (c == null) {
		return;
	}
	var b = c.getActiveCamera();
	if (b != null) {
		b.onMouseDown(a);
	}
	c.postMouseDownToAnimators(a);
};
CL3D.CopperLicht.prototype.isMouseOverCanvas = function () {
	return this.MouseIsInside;
};
CL3D.CopperLicht.prototype.getMouseX = function () {
	return this.MouseX;
};
CL3D.CopperLicht.prototype.getMouseY = function () {
	return this.MouseY;
};
CL3D.CopperLicht.prototype.isMouseDown = function () {
	return this.MouseIsDown;
};
CL3D.CopperLicht.prototype.getMouseDownX = function () {
	return this.MouseDownX;
};
CL3D.CopperLicht.prototype.getMouseDownY = function () {
	return this.MouseDownY;
};
CL3D.CopperLicht.prototype.setMouseDownWhereMouseIsNow = function () {
	this.MouseDownX = this.MouseX;
	this.MouseDownY = this.MouseY;
};
CL3D.CopperLicht.prototype.handleMouseUp = function (a) {
	this.MouseIsDown = false;
	var c = this.getScene();
	if (c == null) {
		return;
	}
	var b = c.getActiveCamera();
	if (b != null) {
		b.onMouseUp(a);
	}
	c.postMouseUpToAnimators(a);
};
CL3D.CopperLicht.prototype.handleMouseMove = function (a) {
	if (a) {
		this.MouseX = this.getMousePosXFromEvent(a);
		this.MouseY = this.getMousePosYFromEvent(a);
	}
	var c = this.getScene();
	if (c == null) {
		return;
	}
	var b = c.getActiveCamera();
	if (b != null) {
		b.onMouseMove(a);
	}
};
CL3D.CopperLicht.prototype.handleMouseWheel = function (a) {
	if (this.MouseIsInside) {
		var c = this.getScene();
		if (c == null) {
			return;
		}
		var b = c.getActiveCamera();
		if (b != null) {
			b.onMouseWheel(a);
		}

		return true;
	}

	return false;
};
CL3D.CopperLicht.prototype.OnAnimate = null;
CL3D.CopperLicht.prototype.OnAfterDrawAll = null;
CL3D.CopperLicht.prototype.OnBeforeDrawAll = null;
CL3D.CopperLicht.prototype.OnLoadingComplete = null;
CL3D.CopperLicht.prototype.get3DPositionFrom2DPosition = function (n, l) {
	var a = this.TheRenderer;
	if (a == null) {
		return null;
	}
	var c = a.getProjection();
	var m = a.getView();
	if (c == null || m == null) {
		return null;
	}
	var b = c.multiply(m);
	var j = new CL3D.ViewFrustrum();
	j.setFrom(b);
	var d = j.getFarLeftUp();
	var g = j.getFarRightUp().substract(d);
	var f = j.getFarLeftDown().substract(d);
	var o = a.getWidth();
	var e = a.getHeight();
	var q = n / o;
	var p = l / e;
	var k = d.add(g.multiplyWithScal(q)).add(f.multiplyWithScal(p));
	return k;
};
CL3D.CopperLicht.prototype.get2DPositionFrom3DPosition = function (b) {
	var k = new CL3D.Matrix4(false);
	var a = this.TheRenderer;
	if (!a.Projection) {
		return null;
	}
	a.Projection.copyTo(k);
	k = k.multiply(a.View);
	var j = a.getWidth() / 2;
	var e = a.getHeight() / 2;
	var h = j;
	var g = e;
	if (e == 0 || j == 0) {
		return null;
	}
	var d = new CL3D.Vect3d(b.X, b.Y, b.Z);
	d.W = 1;
	k.multiplyWith1x4Matrix(d);
	var c = d.W == 0 ? 1 : (1 / d.W);
	if (d.Z < 0) {
		return null;
	}
	var f = new CL3D.Vect2d();
	f.X = j * (d.X * c) + h;
	f.Y = g - (e * (d.Y * c));
	f.Z = d.Z;
	return f;
};
CL3D.CopperLicht.prototype.setActiveCameraNextFrame = function (a) {
	if (a == null) {
		return;
	}
	this.NextCameraToSetActive = a;
};
CL3D.CopperLicht.prototype.getTextureManager = function () {
	return this.TheTextureManager;
};
CL3D.CopperLicht.prototype.setCollisionWorldForAllSceneNodes = function (g, e) {
	if (!g) {
		return;
	}
	for (var a = 0; a < g.Animators.length; ++a) {
		var d = g.Animators[a];
		if (d) {
			if (d.getType() == "collisionresponse") {
				d.setWorld(e);
			} else {
				if (d.getType() == "onclick" || d.getType() == "onmove") {
					d.World = e;
				} else {
					if (d.getType() == "gameai") {
						d.World = e;
					}
				};
			}
		};
	}
	for (var b = 0; b < g.Children.length; ++b) {
		var f = g.Children[b];
		if (f) {
			this.setCollisionWorldForAllSceneNodes(f, e);
		}
	};
};
CL3D.Scene = function () {
	this.RootNode = new CL3D.SceneNode();
	this.RootNode.scene = this;
	this.Name = "";
	this.BackgroundColor = 0;
	this.CollisionWorld = null;
	this.LastUsedRenderer = null;
	this.StartTime = 0;
	this.ActiveCamera = null;
	this.ForceRedrawThisFrame = false;
	this.LastViewProj = new CL3D.Matrix4();
	this.TheSkyBoxSceneNode = null;
	this.RedrawMode = 2;
	this.CurrentRenderMode = 0;
	this.SceneNodesToRender = new Array();
	this.SceneNodesToRenderTransparent = new Array();
	this.LightsToRender = new Array();
	this.Overlay2DToRender = new Array();
	this.RegisteredSceneNodeAnimatorsForEventsList = new Array();
	this.WasAlreadyActivatedOnce = false;
};
CL3D.Scene.prototype.init = function () {
	this.RootNode = new CL3D.SceneNode();
	this.RootNode.scene = this;
	this.Name = "";
	this.LastViewProj = new CL3D.Matrix4();
};
CL3D.Scene.prototype.getSceneType = function () {
	return "unknown";
};
CL3D.Scene.prototype.doAnimate = function (b) {
	this.LastUsedRenderer = b;
	if (this.StartTime = 0) {
		this.StartTime = CL3D.CLTimer.getTime();
	}
	this.TheSkyBoxSceneNode = null;
	var d = this.RootNode.OnAnimate(this, CL3D.CLTimer.getTime());
	var e = this.HasViewChangedSinceLastRedraw();
	var c = b ? b.getAndResetTextureWasLoadedFlag() : false;
	var a = this.ForceRedrawThisFrame || (this.RedrawMode == 0 && (e || c)) || (this.RedrawMode == 1 && (e || d || c)) || (this.RedrawMode == 2);
	if (!a) {
		return false;
	}
	this.ForceRedrawThisFrame = false;
	return true;
};
CL3D.Scene.prototype.getCurrentRenderMode = function () {
	return this.CurrentRenderMode;
};
CL3D.Scene.prototype.drawAll = function (b) {
	this.SceneNodesToRender = new Array();
	this.SceneNodesToRenderTransparent = new Array();
	this.LightsToRender = new Array();
	this.Overlay2DToRender = new Array();
	this.RootNode.OnRegisterSceneNode(this);
	this.CurrentRenderMode = CL3D.Scene.RENDER_MODE_CAMERA;
	var c = null;
	if (this.ActiveCamera) {
		c = this.ActiveCamera.getAbsolutePosition();
		this.ActiveCamera.render(b);
	}
	this.CurrentRenderMode = CL3D.Scene.RENDER_MODE_SKYBOX;
	if (this.SkyBoxSceneNode) {
		this.SkyBoxSceneNode.render(b);
	}
	b.clearDynamicLights();
	var a;
	this.CurrentRenderMode = CL3D.Scene.RENDER_MODE_DEFAULT;
	for (a = 0; a < this.LightsToRender.length; ++a) {
		this.LightsToRender[a].render(b);
	}
	this.CurrentRenderMode = CL3D.Scene.RENDER_MODE_LIGHTS;
	for (a = 0; a < this.SceneNodesToRender.length; ++a) {
		this.SceneNodesToRender[a].render(b);
	}
	this.CurrentRenderMode = CL3D.Scene.RENDER_MODE_TRANSPARENT;
	if (c != null) {
		this.SceneNodesToRenderTransparent.sort(function (f, d) {
			var g = c.getDistanceFromSQ(f.getAbsolutePosition());
			var e = c.getDistanceFromSQ(d.getAbsolutePosition());
			if (g < e) {
				return 1;
			}
			if (g > e) {
				return -1;
			}
			return 0;
		});
	}
	for (a = 0; a < this.SceneNodesToRenderTransparent.length; ++a) {
		this.SceneNodesToRenderTransparent[a].render(b);
	}
	this.CurrentRenderMode = CL3D.Scene.RENDER_MODE_2DOVERLAY;
	for (a = 0; a < this.Overlay2DToRender.length; ++a) {
		this.Overlay2DToRender[a].render(b);
	}
	this.StoreViewMatrixForRedrawCheck();
};
CL3D.Scene.prototype.HasViewChangedSinceLastRedraw = function () {
	if (!this.ActiveCamera) {
		return true;
	}
	var a = new CL3D.Matrix4(false);
	this.ActiveCamera.Projection.copyTo(a);
	a = a.multiply(this.ActiveCamera.ViewMatrix);
	return !a.equals(this.LastViewProj);
};
CL3D.Scene.prototype.StoreViewMatrixForRedrawCheck = function () {
	if (!this.ActiveCamera) {
		return;
	}
	this.ActiveCamera.Projection.copyTo(this.LastViewProj);
	this.LastViewProj = this.LastViewProj.multiply(this.ActiveCamera.ViewMatrix);
};
CL3D.Scene.prototype.getLastUsedRenderer = function () {
	return this.LastUsedRenderer;
};
CL3D.Scene.prototype.setBackgroundColor = function (a) {
	this.BackgroundColor = a;
};
CL3D.Scene.prototype.getBackgroundColor = function () {
	return this.BackgroundColor;
};
CL3D.Scene.prototype.getName = function () {
	return this.Name;
};
CL3D.Scene.prototype.setName = function (a) {
	this.Name = a;
};
CL3D.Scene.prototype.setRedrawMode = function (a) {
	this.RedrawMode = a;
};
CL3D.Scene.prototype.setActiveCamera = function (a) {
	this.ActiveCamera = a;
};
CL3D.Scene.prototype.getActiveCamera = function () {
	return this.ActiveCamera;
};
CL3D.Scene.prototype.forceRedrawNextFrame = function () {
	this.ForceRedrawThisFrame = true;
};
CL3D.Scene.prototype.getStartTime = function () {
	return this.StartTime;
};
CL3D.Scene.prototype.registerNodeForRendering = function (a, b) {
	if (b == null) {
		b = CL3D.Scene.RENDER_MODE_DEFAULT;
	}
	switch (b) {
	case CL3D.Scene.RENDER_MODE_SKYBOX:
		this.SkyBoxSceneNode = a;
		break;
	case CL3D.Scene.RENDER_MODE_DEFAULT:
		this.SceneNodesToRender.push(a);
		break;
	case CL3D.Scene.RENDER_MODE_LIGHTS:
		this.LightsToRender.push(a);
		break;
	case CL3D.Scene.RENDER_MODE_CAMERA:
		break;
	case CL3D.Scene.RENDER_MODE_TRANSPARENT:
		this.SceneNodesToRenderTransparent.push(a);
		break;
	case CL3D.Scene.RENDER_MODE_2DOVERLAY:
		this.Overlay2DToRender.push(a);
		break;
	}
};
CL3D.Scene.prototype.getAllSceneNodesOfType = function (b) {
	if (this.RootNode == null) {
		return null;
	}
	var a = new Array();
	this.getAllSceneNodesOfTypeImpl(this.RootNode, b, a);
	return a;
};
CL3D.Scene.prototype.getAllSceneNodesOfTypeImpl = function (g, f, b) {
	if (g.getType() == f) {
		b.push(g);
	}
	for (var d = 0; d < g.Children.length; ++d) {
		var e = g.Children[d];
		this.getAllSceneNodesOfTypeImpl(e, f, b);
	}
};
CL3D.Scene.prototype.getAllSceneNodesWithAnimator = function (b) {
	if (this.RootNode == null) {
		return null;
	}
	var a = new Array();
	this.getAllSceneNodesWithAnimatorImpl(this.RootNode, b, a);
	return a;
};
CL3D.Scene.prototype.getAllSceneNodesWithAnimatorImpl = function (f, d, b) {
	if (f.getAnimatorOfType(d) != null) {
		b.push(f);
	}
	for (var c = 0; c < f.Children.length; ++c) {
		var e = f.Children[c];
		this.getAllSceneNodesWithAnimatorImpl(e, d, b);
	}
};
CL3D.Scene.prototype.getSceneNodeFromName = function (a) {
	if (this.RootNode == null) {
		return null;
	}
	return this.getSceneNodeFromNameImpl(this.RootNode, a);
};
CL3D.Scene.prototype.getSceneNodeFromNameImpl = function (e, a) {
	if (e.Name == a) {
		return e;
	}
	for (var b = 0; b < e.Children.length; ++b) {
		var d = e.Children[b];
		var c = this.getSceneNodeFromNameImpl(d, a);
		if (c) {
			return c;
		}
	}
	return null;
};
CL3D.Scene.prototype.getSceneNodeFromId = function (a) {
	if (this.RootNode == null) {
		return null;
	}
	return this.getSceneNodeFromIdImpl(this.RootNode, a);
};
CL3D.Scene.prototype.getSceneNodeFromIdImpl = function (e, d) {
	if (e.Id == d) {
		return e;
	}
	for (var a = 0; a < e.Children.length; ++a) {
		var c = e.Children[a];
		var b = this.getSceneNodeFromIdImpl(c, d);
		if (b) {
			return b;
		}
	}
	return null;
};
CL3D.Scene.prototype.getRootSceneNode = function () {
	return this.RootNode;
};
CL3D.Scene.prototype.registerSceneNodeAnimatorForEvents = function (b) {
	if (b == null) {
		return;
	}
	for (var c = 0; c < this.RegisteredSceneNodeAnimatorsForEventsList.length; ++c) {
		var d = this.RegisteredSceneNodeAnimatorsForEventsList[c];
		if (d === b) {
			return;
		}
	}
	this.RegisteredSceneNodeAnimatorsForEventsList.push(b);
};
CL3D.Scene.prototype.unregisterSceneNodeAnimatorForEvents = function (b) {
	if (b == null) {
		return;
	}
	for (var c = 0; c < this.RegisteredSceneNodeAnimatorsForEventsList.length; ++c) {
		var d = this.RegisteredSceneNodeAnimatorsForEventsList[c];
		if (d === b) {
			this.RegisteredSceneNodeAnimatorsForEventsList.splice(c, 1);
			return;
		}
	};
};
CL3D.Scene.prototype.postMouseDownToAnimators = function (c) {
	for (var a = 0; a < this.RegisteredSceneNodeAnimatorsForEventsList.length; ++a) {
		var b = this.RegisteredSceneNodeAnimatorsForEventsList[a];
		b.onMouseDown(c);
	}
};
CL3D.Scene.prototype.postMouseUpToAnimators = function (c) {
	for (var a = 0; a < this.RegisteredSceneNodeAnimatorsForEventsList.length; ++a) {
		var b = this.RegisteredSceneNodeAnimatorsForEventsList[a];
		b.onMouseUp(c);
	}
};
CL3D.Scene.prototype.getCollisionGeometry = function () {
	return this.CollisionWorld;
};
CL3D.Scene.prototype.createCollisionGeometry = function (f, g) {
	var d = this.getAllSceneNodesOfType("mesh");
	if (d == null) {
		return null;
	}
	var b = null;
	if (g) {
		g.clear();
		b = g;
	} else {
		b = new CL3D.MetaTriangleSelector();
	}
	for (var e = 0; e < d.length; ++e) {
		var c = d[e];
		if (c && c.DoesCollision) {
			var a = null;
			if (c.Selector) {
				a = c.Selector;
			} else {
				if (c.OwnedMesh && c.OwnedMesh.GetPolyCount() > 100) {
					a = new CL3D.OctTreeTriangleSelector(c.OwnedMesh, c);
				} else {
					a = new CL3D.MeshTriangleSelector(c.OwnedMesh, c);
				}
			}
			if (f && c.Selector == null) {
				c.Selector = a;
			}
			b.addSelector(a);
		}
	}
	return b;
};
CL3D.Scene.REDRAW_WHEN_CAM_MOVED = 2;
CL3D.Scene.REDRAW_WHEN_SCENE_CHANGED = 1;
CL3D.Scene.REDRAW_EVERY_FRAME = 2;
CL3D.Scene.RENDER_MODE_SKYBOX = 1;
CL3D.Scene.RENDER_MODE_DEFAULT = 0;
CL3D.Scene.RENDER_MODE_LIGHTS = 2;
CL3D.Scene.RENDER_MODE_CAMERA = 3;
CL3D.Scene.RENDER_MODE_TRANSPARENT = 4;
CL3D.Scene.RENDER_MODE_2DOVERLAY = 5;
CL3D.PanoramaScene = function () {
	this.init();
};
CL3D.PanoramaScene.prototype = new CL3D.Scene();
CL3D.PanoramaScene.prototype.getSceneType = function () {
	return "panorama";
};
CL3D.Free3dScene = function () {
	this.init();
	this.DefaultCameraPos = new CL3D.Vect3d();
	this.DefaultCameraTarget = new CL3D.Vect3d();
};
CL3D.Free3dScene.prototype = new CL3D.Scene();
CL3D.Free3dScene.prototype.getSceneType = function () {
	return "free";
};
CL3D.FlaceLoader = function () {
	this.Document = null;
	this.Data = null;
	this.Filename = "";
	this.NextTagPos = 0;
	this.TheTextureManager = null;
	this.CursorControl = null;
	this.PathRoot = "";
	this.TheMeshCache = null;
	this.loadFile = function (c, e, g, h) {
		this.Filename = e;
		this.TheTextureManager = g;
		this.CursorControl = h;
		this.TheMeshCache = new CL3D.MeshCache();
		if (c.length == 0) {
			CL3D.gCCDebugOutput.printError("Error: Could not load file '" + e + "'");
			var f = navigator.appVersion;
			if (f != null && f.indexOf("Chrome") != -1) {
				CL3D.gCCDebugOutput.printError(" < i > For using local files with Chrome, add the parameter '--allow-file-access-from-files' when starting the browser.</i > ", true);
			}
			return null;
		}
		if (e.indexOf(".ccbjs")) {
			c = CL3D.base64decode(c);
		}
		var b = new CL3D.CCDocument();
		this.Document = b;
		var d = this.Filename;
		var a = d.lastIndexOf(" / ");
		if (a != -1) {
			d = d.substring(0, a + 1);
		}
		this.PathRoot = d;
		this.Data = new CL3D.BinaryStream(c);
		if (!this.parseFile()) {
			return null;
		}
		return b;
	};
	this.parseFile = function () {
		var e = this.Data.readSI32();
		if (e != 1701014630) {
			return false;
		}
		var c = this.Data.readSI32();
		var b = this.Data.readUI32();
		var d = 0;
		while (this.Data.bytesAvailable() > 0) {
			var a = this.readTag();
			++d;
			if (d == 1 && a != 1) {
				return false;
			}
			switch (a) {
			case 1:
				this.readDocument();
				break;
			case 12:
				this.readEmbeddedFiles();
				break;
			default:
				this.SkipToNextTag();
			}
		}
		return true;
	};
	this.SkipToNextTag = function () {
		this.Data.seek(this.NextTagPos, true);
	};
	this.readTag = function () {
		var b = 0;
		b = this.Data.readUnsignedShort();
		var a = 0;
		a = this.Data.readUnsignedInt();
		this.CurrentTagSize = a;
		this.NextTagPos = this.Data.getPosition() + a;
		return b;
	};
	this.ReadMatrix = function () {
		var a = new CL3D.Matrix4(false);
		this.ReadIntoExistingMatrix(a);
		return a;
	};
	this.ReadIntoExistingMatrix = function (a) {
		for (var b = 0; b < 16; ++b) {
			a.setByIndex(b, this.Data.readFloat());
		}
	};
	this.ReadQuaternion = function () {
		var a = new CL3D.Quaternion();
		a.W = this.Data.readFloat();
		a.X = this.Data.readFloat();
		a.Y = this.Data.readFloat();
		a.Z = this.Data.readFloat();
		return a;
	};
	this.ReadString = function (e) {
		var d = this.Data.readUnsignedInt();
		if (d > 1024 * 1024 * 100) {
			return "";
		}
		if (d <= 0) {
			return "";
		}
		var c = [];
		for (var a = 0; a < d; ++a) {
			var b = this.Data.readNumber(1);
			if (b != 0) {
				c.push(String.fromCharCode(b));
			}
		}
		return c.join("");
	};
	this.readDocument = function () {
		var d = this.NextTagPos;
		while (this.Data.bytesAvailable() > 0 && this.Data.getPosition() < d) {
			var a = this.readTag();
			switch (a) {
			case 1004:
				this.Document.CurrentScene = this.Data.readInt();
				break;
			case 20:
				this.readPublishSettings();
				break;
			case 2:
				var b = this.Data.readInt();
				var c = null;
				switch (b) {
				case 0:
					c = new CL3D.Free3dScene();
					this.readFreeScene(c);
					break;
				case 1:
					c = new CL3D.PanoramaScene();
					this.readPanoramaScene(c);
					break;
				default:
					this.SkipToNextTag();
				}
				this.Document.addScene(c);
				break;
			default:
				this.SkipToNextTag();
			}
		};
	};
	this.readPublishSettings = function () {
		this.Data.readInt();
		this.Document.ApplicationTitle = this.ReadString();
		var b = this.NextTagPos;
		while (this.Data.bytesAvailable() > 0 && this.Data.getPosition() < b) {
			var a = this.readTag();
			switch (a) {
			case 21:
				this.SkipToNextTag();
				break;
			case 22:
				this.SkipToNextTag();
				break;
			default:
				this.SkipToNextTag();
			}
		};
	};
	this.readFreeScene = function (c) {
		var b = this.NextTagPos;
		this.readScene(c);
		while (this.Data.bytesAvailable() > 0 && this.Data.getPosition() < b) {
			var a = this.readTag();
			switch (a) {
			case 1007:
				c.DefaultCameraPos = this.Read3DVectF();
				c.DefaultCameraTarget = this.Read3DVectF();
				break;
			case 8:
				this.ReadSceneGraph(c);
				break;
			default:
				this.SkipToNextTag();
			}
		};
	};
	this.readPanoramaScene = function (a) {
		this.SkipToNextTag();
	};
	this.Read3DVectF = function () {
		var a = new CL3D.Vect3d();
		a.X = this.Data.readFloat();
		a.Y = this.Data.readFloat();
		a.Z = this.Data.readFloat();
		return a;
	};
	this.Read2DVectF = function () {
		var a = new CL3D.Vect2d();
		a.X = this.Data.readFloat();
		a.Y = this.Data.readFloat();
		return a;
	};
	this.Read3DBoxF = function () {
		var a = new CL3D.Box3d();
		a.MinEdge = this.Read3DVectF();
		a.MaxEdge = this.Read3DVectF();
		return a;
	};
	this.readScene = function (b) {
		var a = this.readTag();
		if (a == 26) {
			b.Name = this.ReadString();
			b.BackgroundColor = this.Data.readInt();
		} else {
			this.JumpBackFromTagReading();
		}
	};
	this.JumpBackFromTagReading = function () {
		this.Data.position -= 10;
	};
	this.ReadSceneGraph = function (c) {
		var b = this.NextTagPos;
		while (this.Data.bytesAvailable() > 0 && this.Data.getPosition() < b) {
			var a = this.readTag();
			switch (a) {
			case 9:
				this.ReadSceneNode(c, c.RootNode, 0);
				break;
			default:
				this.SkipToNextTag();
			}
		};
	};
	this.ReadSceneNode = function (v, q, w) {
		if (q == null) {
			return;
		}
		var e = this.NextTagPos;
		var c = this.Data.readInt();
		var k = this.Data.readInt();
		var A = this.ReadString();
		var d = this.Read3DVectF();
		var j = this.Read3DVectF();
		var x = this.Read3DVectF();
		var h = this.Data.readBoolean();
		var l = this.Data.readInt();
		var f = null;
		var o = 0;
		if (w == 0) {
			q.Visible = h;
			q.Name = A;
			q.Culling = l;
		}
		while (this.Data.bytesAvailable() > 0 && this.Data.getPosition() < e) {
			var z = this.readTag();
			switch (z) {
			case 9:
				this.ReadSceneNode(v, f ? f : q, w + 1);
				break;
			case 10:
				switch (c) {
				case 2037085030:
					var t = new CL3D.SkyBoxSceneNode();
					t.Type = c;
					t.Pos = d;
					t.Rot = j;
					t.Scale = x;
					t.Visible = h;
					t.Name = A;
					t.Culling = l;
					t.Id = k;
					t.scene = v;
					this.readFlaceMeshNode(t);
					q.addChild(t);
					f = t;
					f.updateAbsolutePosition();
					break;
				case 1752395110:
					var m = new CL3D.MeshSceneNode();
					m.Type = c;
					m.Pos = d;
					m.Rot = j;
					m.Scale = x;
					m.Visible = h;
					m.Name = A;
					m.Culling = l;
					m.Id = k;
					m.scene = v;
					this.readFlaceMeshNode(m);
					q.addChild(m);
					f = m;
					f.updateAbsolutePosition();
					break;
				case 1835950438:
					var u = new CL3D.AnimatedMeshSceneNode();
					u.Type = c;
					u.Pos = d;
					u.Rot = j;
					u.Scale = x;
					u.Visible = h;
					u.Name = A;
					u.Culling = l;
					u.Id = k;
					u.scene = v;
					this.readFlaceAnimatedMeshNode(u);
					q.addChild(u);
					f = u;
					f.updateAbsolutePosition();
					break;
				case 1953526632:
					var r = new CL3D.HotspotSceneNode(this.CursorControl, null);
					r.Type = c;
					r.Pos = d;
					r.Rot = j;
					r.Scale = x;
					r.Visible = h;
					r.Name = A;
					r.Culling = l;
					r.Id = k;
					r.scene = v;
					this.readFlaceHotspotNode(r);
					q.addChild(r);
					f = r;
					f.updateAbsolutePosition();
					break;
				case 1819042406:
					var a = new CL3D.BillboardSceneNode();
					a.Type = c;
					a.Pos = d;
					a.Rot = j;
					a.Scale = x;
					a.Visible = h;
					a.Name = A;
					a.Culling = l;
					a.Id = k;
					a.scene = v;
					this.readFlaceBillBoardNode(a);
					q.addChild(a);
					f = a;
					f.updateAbsolutePosition();
					break;
				case 1835098982:
					var s = new CL3D.CameraSceneNode();
					s.Type = c;
					s.Pos = d;
					s.Rot = j;
					s.Scale = x;
					s.Visible = h;
					s.Name = A;
					s.Culling = l;
					s.scene = v;
					s.Id = k;
					this.readFlaceCameraNode(s);
					q.addChild(s);
					f = s;
					f.updateAbsolutePosition();
					break;
				case 1752461414:
					var y = new CL3D.PathSceneNode();
					y.Type = c;
					y.Pos = d;
					y.Rot = j;
					y.Scale = x;
					y.Visible = h;
					y.Name = A;
					y.Culling = l;
					y.Id = k;
					y.scene = v;
					this.readFlacePathNode(y);
					q.addChild(y);
					f = y;
					f.updateAbsolutePosition();
					break;
				case 1954112614:
					var b = new CL3D.DummyTransformationSceneNode();
					b.Type = c;
					b.Pos = d;
					b.Rot = j;
					b.Scale = x;
					b.Visible = h;
					b.Name = A;
					b.Culling = l;
					b.Id = k;
					b.scene = v;
					b.Box = this.Read3DBoxF();
					for (var n = 0; n < 16; ++n) {
						this.Data.readFloat();
					}
					q.addChild(b);
					f = b;
					f.updateAbsolutePosition();
					break;
				case 1868837478:
					var p = new CL3D.Overlay2DSceneNode(this.CursorControl);
					p.Type = c;
					p.Pos = d;
					p.Rot = j;
					p.Scale = x;
					p.Visible = h;
					p.Name = A;
					p.Culling = l;
					p.Id = k;
					p.scene = v;
					this.readFlace2DOverlay(p);
					q.addChild(p);
					f = p;
					f.updateAbsolutePosition();
					break;
				default:
					this.SkipToNextTag();
					break;
				}
				break;
			case 11:
				var g = this.ReadMaterial();
				if (f && f.getMaterial(o)) {
					f.getMaterial(o).setFrom(g);
				}++o;
				break;
			case 25:
				this.ReadAnimator(f, v);
				break;
			default:
				this.SkipToNextTag();
			}
		};
	};
	this.readFlaceMeshNode = function (c) {
		var d = this.NextTagPos;
		c.Box = this.Read3DBoxF();
		this.Data.readBoolean();
		this.Data.readBoolean();
		c.DoesCollision = this.Data.readBoolean();
		this.Data.readBoolean();
		while (this.Data.bytesAvailable() > 0 && this.Data.getPosition() < d) {
			var b = this.readTag();
			switch (b) {
			case 14:
				var a = this.ReadMesh();
				c.OwnedMesh = a;
				break;
			default:
				this.SkipToNextTag();
			}
		};
	};
	this.ReadMesh = function () {
		var b = new CL3D.Mesh();
		b.Box = this.Read3DBoxF();
		var d = this.NextTagPos;
		while (this.Data.bytesAvailable() > 0 && this.Data.getPosition() < d) {
			var a = this.readTag();
			switch (a) {
			case 15:
				var c = this.ReadMeshBuffer();
				if (c != null) {
					b.AddMeshBuffer(c);
				}
				break;
			default:
				this.SkipToNextTag();
			}
		}
		return b;
	};
	this.ReadMeshBuffer = function () {
		var h = new CL3D.MeshBuffer();
		h.Box = this.Read3DBoxF();
		var a = this.NextTagPos;
		while (this.Data.bytesAvailable() > 0 && this.Data.getPosition() < a) {
			var o = this.readTag();
			switch (o) {
			case 11:
				h.Mat = this.ReadMaterial();
				break;
			case 16:
				var k = Math.floor(this.CurrentTagSize / 2);
				for (var f = 0; f < k; ++f) {
					h.Indices.push(this.Data.readShort());
				}
				break;
			case 17:
				var l = Math.floor(this.CurrentTagSize / 36);
				for (var n = 0; n < l; ++n) {
					var b = new CL3D.Vertex3D();
					b.Pos = this.Read3DVectF();
					b.Normal = this.Read3DVectF();
					b.Color = this.Data.readInt();
					b.TCoords = this.Read2DVectF();
					b.TCoords2 = new CL3D.Vect2d();
					h.Vertices.push(b);
				}
				break;
			case 18:
				var j = Math.floor(this.CurrentTagSize / 44);
				for (var d = 0; d < j; ++d) {
					var g = new CL3D.Vertex3D();
					g.Pos = this.Read3DVectF();
					g.Normal = this.Read3DVectF();
					g.Color = this.Data.readInt();
					g.TCoords = this.Read2DVectF();
					g.TCoords2 = this.Read2DVectF();
					h.Vertices.push(g);
				}
				break;
			case 19:
				var c = this.CurrentTagSize / 60;
				for (var m = 0; m < c; ++m) {
					var e = new CL3D.Vertex3D();
					e.Pos = this.Read3DVectF();
					e.Normal = this.Read3DVectF();
					e.Color = this.Data.readInt();
					e.TCoords = this.Read2DVectF();
					e.TCoords2 = new CL3D.Vect2d();
					this.Read3DVectF();
					this.Read3DVectF();
					h.Vertices.push(e);
				}
				break;
			default:
				this.SkipToNextTag();
			}
		}
		return h;
	};
	this.ReadMaterial = function () {
		var c = new CL3D.Material();
		c.Type = this.Data.readInt();
		this.Data.readInt();
		this.Data.readInt();
		this.Data.readInt();
		this.Data.readInt();
		this.Data.readFloat();
		this.Data.readInt();
		this.Data.readInt();
		this.Data.readBoolean();
		this.Data.readBoolean();
		c.Lighting = this.Data.readBoolean();
		c.ZWriteEnabled = this.Data.readBoolean();
		this.Data.readByte();
		this.Data.readBoolean();
		this.Data.readBoolean();
		this.Data.readBoolean();
		this.Data.readBoolean();
		for (var b = 0; b < 4; ++b) {
			var a = this.ReadTextureRef();
			switch (b) {
			case 0:
				c.Tex1 = a;
				break;
			case 1:
				c.Tex2 = a;
				break;
			}
			this.Data.readBoolean();
			this.Data.readBoolean();
			this.Data.readBoolean();
			var d = this.Data.readShort();
			if (d != 0) {
				switch (b) {
				case 0:
					c.ClampTexture1 = true;
					break;
				case 1:
					break;
				}
			};
		}
		return c;
	};
	this.ReadFileStrRef = function () {
		return this.ReadString();
	};
	this.ReadTextureRef = function () {
		var b = this.ReadFileStrRef();
		var a = this.PathRoot + b;
		if (this.TheTextureManager != null && b != "") {
			return this.TheTextureManager.getTexture(a, true);
		}
		return null;
	};
	this.readFlaceHotspotNode = function (b) {
		var c = this.NextTagPos;
		b.Box = this.Read3DBoxF();
		b.Width = this.Data.readInt();
		b.Height = this.Data.readInt();
		while (this.Data.bytesAvailable() > 0 && this.Data.getPosition() < c) {
			var a = this.readTag();
			switch (a) {
			case 3:
				this.readHotspotData(b);
				break;
			default:
				this.SkipToNextTag();
			}
		};
	};
	this.readHotspotData = function (b) {
		var c = this.NextTagPos;
		b.caption = this.ReadString();
		b.TheTexture = this.ReadTextureRef();
		this.Read2DVectF();
		this.Data.readInt();
		b.dateLimit = this.ReadString();
		b.useDateLimit = this.Data.readBoolean();
		while (this.Data.bytesAvailable() > 0 && this.Data.getPosition() < c) {
			var a = this.readTag();
			switch (a) {
			case 6:
				b.bExecuteJavaScript = true;
				b.executeJavaScript = this.ReadString();
				break;
			case 4:
				b.bGotoScene = true;
				b.gotoScene = this.ReadString();
				break;
			case 5:
				b.bOpenWebsite = true;
				b.website = this.ReadString();
				b.websiteTarget = this.ReadString();
				break;
			default:
				this.SkipToNextTag();
			}
		};
	};
	this.readFlaceCameraNode = function (a) {
		a.Box = this.Read3DBoxF();
		a.Target = this.Read3DVectF();
		a.UpVector = this.Read3DVectF();
		a.Fovy = this.Data.readFloat();
		a.Aspect = this.Data.readFloat();
		a.ZNear = this.Data.readFloat();
		a.ZFar = this.Data.readFloat();
		a.Active = this.Data.readBoolean();
	};
	this.readFlaceBillBoardNode = function (b) {
		b.MeshBuffer.Box = this.Read3DBoxF();
		b.Box = b.MeshBuffer.Box;
		b.SizeX = this.Data.readFloat();
		b.SizeY = this.Data.readFloat();
		var a = this.Data.readByte();
		b.IsVertical = (a & 2) != 0;
	};
	this.readFlacePathNode = function (a) {
		a.Box = this.Read3DBoxF();
		a.Tightness = this.Data.readFloat();
		a.IsClosedCircle = this.Data.readBoolean();
		this.Data.readInt();
		var b = this.Data.readInt();
		for (var c = 0; c < b; ++c) {
			a.Nodes.push(this.Read3DVectF());
		}
	};
	this.readFlace2DOverlay = function (a) {
		this.Data.readInt();
		a.SizeModeIsAbsolute = this.Data.readBoolean();
		if (a.SizeModeIsAbsolute) {
			a.PosAbsoluteX = this.Data.readInt();
			a.PosAbsoluteY = this.Data.readInt();
			a.SizeAbsoluteWidth = this.Data.readInt();
			a.SizeAbsoluteHeight = this.Data.readInt();
		} else {
			a.PosRelativeX = this.Data.readFloat();
			a.PosRelativeY = this.Data.readFloat();
			a.SizeRelativeWidth = this.Data.readFloat();
			a.SizeRelativeHeight = this.Data.readFloat();
		}
		a.ShowBackGround = this.Data.readBoolean();
		a.BackGroundColor = this.Data.readInt();
		a.Texture = this.ReadTextureRef();
		a.TextureHover = this.ReadTextureRef();
		a.RetainAspectRatio = this.Data.readBoolean();
		a.DrawText = this.Data.readBoolean();
		a.TextAlignment = this.Data.readByte();
		a.Text = this.ReadString();
		a.FontName = this.ReadString();
		a.TextColor = this.Data.readInt();
		a.AnimateOnHover = this.Data.readBoolean();
		a.OnHoverSetFontColor = this.Data.readBoolean();
		a.HoverFontColor = this.Data.readInt();
		a.OnHoverSetBackgroundColor = this.Data.readBoolean();
		a.HoverBackgroundColor = this.Data.readInt();
		a.OnHoverDrawTexture = this.Data.readBoolean();
	};
	this.ReadAnimator = function (r, v) {
		if (!r) {
			this.SkipToNextTag();
			return;
		}
		var t;
		var o;
		var d = this.Data.readInt();
		var w = null;
		switch (d) {
		case 100:
			var a = new CL3D.AnimatorRotation();
			a.Rotation = this.Read3DVectF();
			w = a;
			break;
		case 101:
			var n = new CL3D.AnimatorFlyStraight();
			n.Start = this.Read3DVectF();
			n.End = this.Read3DVectF();
			n.TimeForWay = this.Data.readInt();
			n.Loop = this.Data.readBoolean();
			n.recalculateImidiateValues();
			w = n;
			break;
		case 102:
			var l = new CL3D.AnimatorFlyCircle();
			l.Center = this.Read3DVectF();
			l.Direction = this.Read3DVectF();
			l.Radius = this.Data.readFloat();
			l.Speed = this.Data.readFloat();
			l.init();
			w = l;
			break;
		case 103:
			var q = new CL3D.AnimatorCollisionResponse();
			q.Radius = this.Read3DVectF();
			q.Gravity = this.Read3DVectF();
			q.Translation = this.Read3DVectF();
			this.Read3DVectF();
			q.SlidingSpeed = this.Data.readFloat();
			w = q;
			break;
		case 104:
			var b = new CL3D.AnimatorCameraFPS(r, this.CursorControl);
			b.MaxVerticalAngle = this.Data.readFloat();
			b.MoveSpeed = this.Data.readFloat();
			b.RotateSpeed = this.Data.readFloat();
			b.JumpSpeed = this.Data.readFloat();
			b.NoVerticalMovement = this.Data.readBoolean();
			var g = this.Data.readInt();
			if (g & 1) {
				b.moveByMouseMove = false;
				b.moveByMouseDown = true;
			} else {
				b.moveByMouseMove = true;
				b.moveByMouseDown = false;
			}
			w = b;
			break;
		case 105:
			var c = new CL3D.AnimatorCameraModelViewer(r, this.CursorControl);
			c.Radius = this.Data.readFloat();
			c.RotateSpeed = this.Data.readFloat();
			c.NoVerticalMovement = this.Data.readBoolean();
			this.Data.readInt();
			w = c;
			break;
		case 106:
			var k = new CL3D.AnimatorFollowPath(v);
			k.TimeNeeded = this.Data.readInt();
			k.LookIntoMovementDirection = this.Data.readBoolean();
			k.PathToFollow = this.ReadString();
			k.OnlyMoveWhenCameraActive = this.Data.readBoolean();
			k.AdditionalRotation = this.Read3DVectF();
			k.EndMode = this.Data.readByte();
			k.CameraToSwitchTo = this.ReadString();
			this.Data.readInt();
			w = k;
			break;
		case 107:
			var j = new CL3D.AnimatorOnClick(v, this.CursorControl);
			j.BoundingBoxTestOnly = this.Data.readBoolean();
			j.CollidesWithWorld = this.Data.readBoolean();
			this.Data.readInt();
			j.TheActionHandler = this.ReadActionHandlerSection(v);
			w = j;
			break;
		case 108:
			var e = new CL3D.AnimatorOnProximity(v);
			e.EnterType = this.Data.readInt();
			e.ProximityType = this.Data.readInt();
			e.Range = this.Data.readFloat();
			e.SceneNodeToTest = this.Data.readInt();
			this.Data.readInt();
			e.TheActionHandler = this.ReadActionHandlerSection(v);
			w = e;
			break;
		case 109:
			var f = new CL3D.AnimatorAnimateTexture();
			f.TextureChangeType = this.Data.readInt();
			f.TimePerFrame = this.Data.readInt();
			f.TextureIndexToChange = this.Data.readInt();
			f.Loop = this.Data.readBoolean();
			var m = this.Data.readInt();
			f.Textures = new Array();
			for (var s = 0; s < m; ++s) {
				f.Textures.push(this.ReadTextureRef());
			}
			w = f;
			break;
		case 110:
			var j = new CL3D.AnimatorOnMove(v, this.CursorControl);
			j.BoundingBoxTestOnly = this.Data.readBoolean();
			j.CollidesWithWorld = this.Data.readBoolean();
			this.Data.readInt();
			j.ActionHandlerOnLeave = this.ReadActionHandlerSection(v);
			j.ActionHandlerOnEnter = this.ReadActionHandlerSection(v);
			w = j;
			break;
		case 111:
			var p = new CL3D.AnimatorTimer(v);
			p.TickEverySeconds = this.Data.readInt();
			this.Data.readInt();
			p.TheActionHandler = this.ReadActionHandlerSection(v);
			w = p;
			break;
		case 112:
			var u = new CL3D.AnimatorOnKeyPress(v, this.CursorControl);
			u.KeyPressType = this.Data.readInt();
			u.KeyCode = this.Data.readInt();
			u.IfCameraOnlyDoIfActive = this.Data.readBoolean();
			this.Data.readInt();
			u.TheActionHandler = this.ReadActionHandlerSection(v);
			w = u;
			break;
		case 113:
			var h = new CL3D.AnimatorGameAI(v);
			h.AIType = this.Data.readInt();
			h.MovementSpeed = this.Data.readFloat();
			h.ActivationRadius = this.Data.readFloat();
			h.CanFly = this.Data.readBoolean();
			h.Health = this.Data.readInt();
			h.Tags = this.ReadString();
			h.AttacksAIWithTags = this.ReadString();
			h.PatrolRadius = this.Data.readFloat();
			h.RotationSpeedMs = this.Data.readInt();
			h.AdditionalRotationForLooking = this.Read3DVectF();
			h.StandAnimation = this.ReadString();
			h.WalkAnimation = this.ReadString();
			h.DieAnimation = this.ReadString();
			h.AttackAnimation = this.ReadString();
			this.Data.readInt();
			h.ActionHandlerOnAttack = this.ReadActionHandlerSection(v);
			h.ActionHandlerOnActivate = this.ReadActionHandlerSection(v);
			h.ActionHandlerOnHit = this.ReadActionHandlerSection(v);
			h.ActionHandlerOnDie = this.ReadActionHandlerSection(v);
			w = h;
			break;
		default:
			this.SkipToNextTag();
			return;
		}
		if (w) {
			r.addAnimator(w);
		}
	};
	this.ReadActionHandlerSection = function (b) {
		var c = this.Data.readInt();
		if (c) {
			var a = new CL3D.ActionHandler(b);
			this.ReadActionHandler(a, b);
			return a;
		}
		return null;
	};
	this.ReadActionHandler = function (c, f) {
		var a = this.readTag();
		if (a != 29) {
			this.SkipToNextTag();
			return;
		}
		var b = this.NextTagPos;
		while (this.Data.bytesAvailable() > 0 && this.Data.getPosition() < b) {
			a = this.readTag();
			if (a == 30) {
				var d = this.Data.readInt();
				var e = this.ReadAction(d, f);
				if (e) {
					c.addAction(e);
				}
			} else {
				this.SkipToNextTag();
			}
		};
	};
	this.readEmbeddedFiles = function () {
		var f = this.NextTagPos;
		while (this.Data.bytesAvailable() > 0 && this.Data.getPosition() < f) {
			var a = this.readTag();
			switch (a) {
			case 13:
				var b = this.Data.readInt();
				var d = this.ReadString();
				var c = this.Data.readInt();
				if (b & 4) {
					var e = this.TheMeshCache.getMeshFromName(d);
					if (e) {
						this.readSkinnedMesh(e, c);
					}
				}
				this.SkipToNextTag();
				break;
			default:
				this.SkipToNextTag();
			}
		};
	};
	this.readFlaceAnimatedMeshNode = function (c) {
		c.Box = this.Read3DBoxF();
		this.Data.readBoolean();
		this.Data.readInt();
		var b = this.Data.readInt();
		var a = this.Data.readInt();
		c.FramesPerSecond = this.Data.readFloat();
		this.Data.readByte();
		c.Looping = this.Data.readBoolean();
		this.Data.readInt();
		c.setMesh(this.ReadAnimatedMeshRef(c));
		c.StartFrame = b;
		c.EndFrame = a;
	};
	this.ReadAnimatedMeshRef = function (a) {
		var b = this.ReadFileStrRef();
		var c = this.TheMeshCache.getMeshFromName(b);
		if (c == null) {
			var d = new CL3D.SkinnedMesh();
			d.Name = b;
			this.TheMeshCache.addMesh(d);
			c = d;
		}
		if (a != null && c != null) {
			if (c.AnimatedMeshesToLink == null) {
				c.AnimatedMeshesToLink = new Array();
			}
			c.AnimatedMeshesToLink.push(a);
		}
		return c;
	};
	this.readSkinnedMesh = function (a, n) {
		if (a == null) {
			return;
		}
		this.Data.readInt();
		a.DefaultFPS = this.Data.readFloat();
		var u = this.NextTagPos;
		var v = this.Data.getPosition() + n;
		var m = new Array();
		var s = 0;
		while (this.Data.bytesAvailable() > 0 && this.Data.getPosition() < u && this.Data.getPosition() < v) {
			var w = this.readTag();
			if (w == 33) {
				var q = new CL3D.SkinnedMeshJoint();
				q.Name = this.ReadString();
				q.LocalMatrix = this.ReadMatrix();
				q.GlobalInversedMatrix = this.ReadMatrix();
				a.AllJoints.push(q);
				var d = this.Data.readInt();
				m.push(q);
				if (d >= 0 && d < m.length) {
					var t = m[d];
					t.Children.push(q);
				}
				var f = this.Data.readInt();
				for (var o = 0; o < f; ++o) {
					q.AttachedMeshes.push(this.Data.readInt());
				}
				var c = this.Data.readInt();
				for (s = 0; s < c; ++s) {
					var g = new CL3D.SkinnedMeshPositionKey();
					g.frame = this.Data.readFloat();
					g.position = this.Read3DVectF();
					q.PositionKeys.push(g);
				}
				c = this.Data.readInt();
				for (s = 0; s < c; ++s) {
					var b = new CL3D.SkinnedMeshScaleKey();
					b.frame = this.Data.readFloat();
					b.scale = this.Read3DVectF();
					q.ScaleKeys.push(b);
				}
				c = this.Data.readInt();
				for (s = 0; s < c; ++s) {
					var r = new CL3D.SkinnedMeshRotationKey();
					r.frame = this.Data.readFloat();
					r.rotation = this.ReadQuaternion();
					q.RotationKeys.push(r);
				}
				c = this.Data.readInt();
				for (s = 0; s < c; ++s) {
					var h = new CL3D.SkinnedMeshWeight();
					h.buffer_id = this.Data.readUnsignedShort();
					h.vertex_id = this.Data.readInt();
					h.strength = this.Data.readFloat();
					q.Weights.push(h);
				}
			} else {
				if (w == 15) {
					var p = this.ReadMeshBuffer();
					if (p != null) {
						a.AddMeshBuffer(p);
					}
				} else {
					if (w == 34) {
						var l = new CL3D.NamedAnimationRange();
						l.Name = this.ReadString();
						l.Begin = this.Data.readFloat();
						l.End = this.Data.readFloat();
						l.FPS = this.Data.readFloat();
						a.addNamedAnimationRange(l);
					} else {
						this.SkipToNextTag();
					}
				};
			}
		}
		try {
			a.finalize();
		} catch (e) {
			CL3D.gCCDebugOutput.printError("error finalizing skinned mesh: " + e);
		}
		if (a.AnimatedMeshesToLink && a.AnimatedMeshesToLink.length) {
			for (s = 0; s < a.AnimatedMeshesToLink.length; ++s) {
				var k = a.AnimatedMeshesToLink[s];
				if (k) {
					k.setFrameLoop(k.StartFrame, k.EndFrame);
				}
			}
			a.AnimatedMeshesToLink = null;
		}
	};
	this.ReadAction = function (d, q) {
		var j = 0;
		switch (d) {
		case 0:
			var p = new CL3D.Action.MakeSceneNodeInvisible();
			p.InvisibleMakeType = this.Data.readInt();
			p.SceneNodeToMakeInvisible = this.Data.readInt();
			p.ChangeCurrentSceneNode = this.Data.readBoolean();
			this.Data.readInt();
			return p;
		case 1:
			var h = new CL3D.Action.ChangeSceneNodePosition();
			h.PositionChangeType = this.Data.readInt();
			h.SceneNodeToChangePosition = this.Data.readInt();
			h.ChangeCurrentSceneNode = this.Data.readBoolean();
			h.Vector = this.Read3DVectF();
			h.RelativeToCurrentSceneNode = this.Data.readBoolean();
			h.SceneNodeRelativeTo = this.Data.readInt();
			j = this.Data.readInt();
			if (j & 1) {
				h.UseAnimatedMovement = true;
				h.TimeNeededForMovementMs = this.Data.readInt();
			}
			return h;
		case 2:
			var g = new CL3D.Action.ChangeSceneNodeRotation();
			g.RotationChangeType = this.Data.readInt();
			g.SceneNodeToChangeRotation = this.Data.readInt();
			g.ChangeCurrentSceneNode = this.Data.readBoolean();
			g.Vector = this.Read3DVectF();
			g.RotateAnimated = false;
			j = this.Data.readInt();
			if (j & 1) {
				g.RotateAnimated = true;
				g.TimeNeededForRotationMs = this.Data.readInt();
			}
			return g;
		case 3:
			var f = new CL3D.Action.ChangeSceneNodeScale();
			f.ScaleChangeType = this.Data.readInt();
			f.SceneNodeToChangeScale = this.Data.readInt();
			f.ChangeCurrentSceneNode = this.Data.readBoolean();
			f.Vector = this.Read3DVectF();
			this.Data.readInt();
			return f;
		case 4:
			var e = new CL3D.Action.ChangeSceneNodeTexture();
			e.TextureChangeType = this.Data.readInt();
			e.SceneNodeToChange = this.Data.readInt();
			e.ChangeCurrentSceneNode = this.Data.readBoolean();
			e.TheTexture = this.ReadTextureRef();
			this.Data.readInt();
			return e;
		case 5:
			this.SkipToNextTag();
		case 6:
			this.SkipToNextTag();
		case 7:
			var r = new CL3D.Action.ExecuteJavaScript();
			this.Data.readInt();
			r.JScript = this.ReadString();
			return r;
		case 8:
			var s = new CL3D.Action.OpenWebpage();
			this.Data.readInt();
			s.Webpage = this.ReadString();
			s.Target = this.ReadString();
			return s;
		case 9:
			var t = new CL3D.Action.SetSceneNodeAnimation();
			t.SceneNodeToChangeAnim = this.Data.readInt();
			t.ChangeCurrentSceneNode = this.Data.readBoolean();
			t.Loop = this.Data.readBoolean();
			t.AnimName = this.ReadString();
			this.Data.readInt();
			return t;
		case 10:
			var c = new CL3D.Action.SwitchToScene(this.CursorControl);
			c.SceneName = this.ReadString();
			this.Data.readInt();
			return c;
		case 11:
			var m = new CL3D.Action.SetActiveCamera(this.CursorControl);
			m.CameraToSetActive = this.Data.readInt();
			this.Data.readInt();
			return m;
		case 12:
			var k = new CL3D.Action.SetCameraTarget();
			k.PositionChangeType = this.Data.readInt();
			k.SceneNodeToChangePosition = this.Data.readInt();
			k.ChangeCurrentSceneNode = this.Data.readBoolean();
			k.Vector = this.Read3DVectF();
			k.RelativeToCurrentSceneNode = this.Data.readBoolean();
			k.SceneNodeRelativeTo = this.Data.readInt();
			j = this.Data.readInt();
			if (j & 1) {
				k.UseAnimatedMovement = true;
				k.TimeNeededForMovementMs = this.Data.readInt();
			}
			return k;
		case 13:
			var b = new CL3D.Action.Shoot();
			b.ShootType = this.Data.readInt();
			b.Damage = this.Data.readInt();
			b.BulletSpeed = this.Data.readFloat();
			b.SceneNodeToUseAsBullet = this.Data.readInt();
			b.WeaponRange = this.Data.readFloat();
			j = this.Data.readInt();
			if (j & 1) {
				b.SceneNodeToShootFrom = this.Data.readInt();
				b.ShootToCameraTarget = this.Data.readBoolean();
				b.AdditionalDirectionRotation = this.Read3DVectF();
			}
			return b;
		case 14:
			this.SkipToNextTag();
			return null;
		case 15:
			var n = new CL3D.Action.SetOverlayText();
			this.Data.readInt();
			n.SceneNodeToChange = this.Data.readInt();
			n.ChangeCurrentSceneNode = this.Data.readBoolean();
			n.Text = this.ReadString();
			return n;
		case 16:
			var o = new CL3D.Action.SetOrChangeAVariable();
			this.Data.readInt();
			o.VariableName = this.ReadString();
			o.Operation = this.Data.readInt();
			o.ValueType = this.Data.readInt();
			o.Value = this.ReadString();
			return o;
		case 17:
			var a = new CL3D.Action.IfVariable();
			this.Data.readInt();
			a.VariableName = this.ReadString();
			a.ComparisonType = this.Data.readInt();
			a.ValueType = this.Data.readInt();
			a.Value = this.ReadString();
			a.TheActionHandler = this.ReadActionHandlerSection(q);
			return a;
		case 18:
			var l = new CL3D.Action.RestartBehaviors();
			l.SceneNodeToRestart = this.Data.readInt();
			l.ChangeCurrentSceneNode = this.Data.readBoolean();
			this.Data.readInt();
			return l;
		default:
			this.SkipToNextTag();
		}
		return null;
	}
};
CL3D.CCDocument = function () {
	this.CurrentScene = -1;
	this.ApplicationTitle = "";
	this.Scenes = new Array();
	this.UpdateMode = CL3D.Scene.REDRAW_EVERY_FRAME;
	this.CanvasWidth = 320;
	this.CanvasHeight = 200;
	this.addScene = function (a) {
		this.Scenes.push(a);
	};
	this.getCurrentScene = function (a) {
		if (this.CurrentScene < 0 || this.CurrentScene >= this.Scenes.length) {
			return null;
		}
		return this.Scenes[this.CurrentScene];
	};
	this.setCurrentScene = function (b) {
		for (var a = 0; a < this.Scenes.length; ++a) {
			if (this.Scenes[a] === b) {
				this.CurrentScene = a;
				return;
			}
		};
	}
};
CL3D.base64DecodeChars = new Array(-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);
CL3D.base64decode = function (j) {
	var f, d, b, a;
	var g, h, e;
	var c = CL3D.base64DecodeChars;
	h = j.length;
	g = 0;
	e = "";
	while (g < h) {
		do {
			f = c[j.charCodeAt(g++) & 255];
		}
		while (g < h && f == -1);
		if (f == -1) {
			break;
		}
		do {
			d = c[j.charCodeAt(g++) & 255];
		}
		while (g < h && d == -1);
		if (d == -1) {
			break;
		}
		e += String.fromCharCode((f << 2) | ((d & 48) >> 4));
		do {
			b = j.charCodeAt(g++) & 255;
			if (b == 61) {
				return e;
			}
			b = c[b];
		}
		while (g < h && b == -1);
		if (b == -1) {
			break;
		}
		e += String.fromCharCode(((d & 15) << 4) | ((b & 60) >> 2));
		do {
			a = j.charCodeAt(g++) & 255;
			if (a == 61) {
				return e;
			}
			a = c[a];
		}
		while (g < h && a == -1);
		if (a == -1) {
			break;
		}
		e += String.fromCharCode(((b & 3) << 6) | a);
	}
	return e;
};
CL3D.TriangleSelector = function () {};
CL3D.TriangleSelector.prototype.getAllTriangles = function (a, b) {};
CL3D.TriangleSelector.prototype.getTrianglesInBox = function (c, a, b) {
	this.getAllTriangles(a, b);
};
CL3D.TriangleSelector.prototype.getCollisionPointWithLine = function (d, c, e, l) {
	if (!d || !c) {
		return null;
	}
	var g = new CL3D.Box3d();
	g.MinEdge = d.clone();
	g.MaxEdge = d.clone();
	g.addInternalPointByVector(c);
	var k = new Array();
	this.getTrianglesInBox(g, null, k);
	var b = c.substract(d);
	b.normalize();
	var f;
	var a = 999999999.9;
	var j = c.substract(d).getLengthSQ();
	var u = Math.min(d.X, c.X);
	var s = Math.max(d.X, c.X);
	var r = Math.min(d.Y, c.Y);
	var q = Math.max(d.Y, c.Y);
	var p = Math.min(d.Z, c.Z);
	var o = Math.max(d.Z, c.Z);
	var v = null;
	for (var n = 0; n < k.length; ++n) {
		var m = k[n];
		if (e && !m.getPlane().isFrontFacing(b)) {
			continue;
		}
		if (u > m.pointA.X && u > m.pointB.X && u > m.pointC.X) {
			continue;
		}
		if (s < m.pointA.X && s < m.pointB.X && s < m.pointC.X) {
			continue;
		}
		if (r > m.pointA.Y && r > m.pointB.Y && r > m.pointC.Y) {
			continue;
		}
		if (q < m.pointA.Y && q < m.pointB.Y && q < m.pointC.Y) {
			continue;
		}
		if (p > m.pointA.Z && p > m.pointB.Z && p > m.pointC.Z) {
			continue;
		}
		if (o < m.pointA.Z && o < m.pointB.Z && o < m.pointC.Z) {
			continue;
		}
		if (d.getDistanceFromSQ(m.pointA) >= a && d.getDistanceFromSQ(m.pointB) >= a && d.getDistanceFromSQ(m.pointC) >= a) {
			continue;
		}
		f = m.getIntersectionWithLine(d, b);
		if (f) {
			var t = f.getDistanceFromSQ(d);
			var h = f.getDistanceFromSQ(c);
			if (t < j && h < j && t < a) {
				a = t;
				if (l) {
					m.copyTo(l);
				}
				v = f;
			}
		};
	}
	if (v) {
		return v.clone();
	}
	return null;
};
CL3D.MeshTriangleSelector = function (l, k) {
	if (!l) {
		return;
	}
	this.Node = k;
	this.Triangles = new Array();
	for (var g = 0; g < l.MeshBuffers.length; ++g) {
		var h = l.MeshBuffers[g];
		if (h) {
			var c = h.Indices.length;
			for (var a = 0; a < c; a += 3) {
				var f = h.Vertices[h.Indices[a]];
				var e = h.Vertices[h.Indices[a + 1]];
				var d = h.Vertices[h.Indices[a + 2]];
				this.Triangles.push(new CL3D.Triangle3d(f.Pos, e.Pos, d.Pos));
			}
		};
	}
};
CL3D.MeshTriangleSelector.prototype = new CL3D.TriangleSelector();
CL3D.MeshTriangleSelector.prototype.getAllTriangles = function (a, d) {
	if (!this.Node.AbsoluteTransformation) {
		return;
	}
	var c;
	if (a) {
		c = a.multiply(this.Node.AbsoluteTransformation);
	} else {
		c = this.Node.AbsoluteTransformation;
	}
	var b;
	if (c.isIdentity()) {
		for (b = 0; b < this.Triangles.length; ++b) {
			d.push(this.Triangles[b]);
		}
	} else {
		if (c.isTranslateOnly()) {
			for (b = 0; b < this.Triangles.length; ++b) {
				d.push(new CL3D.Triangle3d(c.getTranslatedVect(this.Triangles[b].pointA), c.getTranslatedVect(this.Triangles[b].pointB), c.getTranslatedVect(this.Triangles[b].pointC)));
			}
		} else {
			for (b = 0; b < this.Triangles.length; ++b) {
				d.push(new CL3D.Triangle3d(c.getTransformedVect(this.Triangles[b].pointA), c.getTransformedVect(this.Triangles[b].pointB), c.getTransformedVect(this.Triangles[b].pointC)));
			}
		};
	}
};
CL3D.MeshTriangleSelector.prototype.getTrianglesInBox = function (c, a, b) {
	this.getAllTriangles(a, b);
};
CL3D.MetaTriangleSelector = function () {
	this.Selectors = new Array();
};
CL3D.MetaTriangleSelector.prototype = new CL3D.TriangleSelector();
CL3D.MetaTriangleSelector.prototype.getAllTriangles = function (a, c) {
	for (var b = 0; b < this.Selectors.length; ++b) {
		this.Selectors[b].getAllTriangles(a, c);
	}
};
CL3D.MetaTriangleSelector.prototype.getTrianglesInBox = function (d, a, c) {
	for (var b = 0; b < this.Selectors.length; ++b) {
		this.Selectors[b].getTrianglesInBox(d, a, c);
	}
};
CL3D.MetaTriangleSelector.prototype.addSelector = function (a) {
	this.Selectors.push(a);
};
CL3D.MetaTriangleSelector.prototype.clear = function () {
	this.Selectors = new Array();
};
CL3D.SOctTreeNode = function () {
	this.Triangles = new Array();
	this.Box = new CL3D.Box3d();
	this.Child = new Array();
};
CL3D.OctTreeTriangleSelector = function (n, l, g) {
	this.DebugNodeCount = 0;
	this.DebugPolyCount = 0;
	if (g == null) {
		this.MinimalPolysPerNode = 64;
	} else {
		this.MinimalPolysPerNode = g;
	}
	if (!n) {
		return;
	}
	this.Node = l;
	this.Root = new CL3D.SOctTreeNode();
	this.Triangles = new Array();
	for (var h = 0; h < n.MeshBuffers.length; ++h) {
		var k = n.MeshBuffers[h];
		if (k) {
			var c = k.Indices.length;
			for (var a = 0; a < c; a += 3) {
				var f = k.Vertices[k.Indices[a]];
				var e = k.Vertices[k.Indices[a + 1]];
				var d = k.Vertices[k.Indices[a + 2]];
				var m = new CL3D.Triangle3d(f.Pos, e.Pos, d.Pos);
				this.Root.Triangles.push(m);
				this.Triangles.push(m);
			}
		};
	}
	this.constructTree(this.Root);
};
CL3D.OctTreeTriangleSelector.prototype = new CL3D.TriangleSelector();
CL3D.OctTreeTriangleSelector.prototype.constructTree = function (c) {
	++this.DebugNodeCount;
	c.Box.MinEdge = c.Triangles[0].pointA.clone();
	c.Box.MaxEdge = c.Box.MinEdge.clone();
	var h;
	var b = c.Triangles.length;
	for (var e = 1; e < b; ++e) {
		h = c.Triangles[e];
		c.Box.addInternalPointByVector(h.pointA);
		c.Box.addInternalPointByVector(h.pointB);
		c.Box.addInternalPointByVector(h.pointC);
	}
	if (!c.Box.MinEdge.equals(c.Box.MaxEdge) && b > this.MinimalPolysPerNode) {
		var j = c.Box.getCenter();
		var d = c.Box.getEdges();
		var f = new CL3D.Box3d();
		for (var a = 0; a < 8; ++a) {
			var g = new Array();
			f.MinEdge = j.clone();
			f.MaxEdge = j.clone();
			f.addInternalPointByVector(d[a]);
			c.Child.push(new CL3D.SOctTreeNode());
			for (var e = 0; e < c.Triangles.length; ++e) {
				h = c.Triangles[e];
				if (h.isTotalInsideBox(f)) {
					c.Child[a].Triangles.push(h);
				} else {
					g.push(h);
				}
			}
			c.Triangles = g;
			if (c.Child[a].Triangles.length == 0) {
				c.Child[a] = null;
			} else {
				this.constructTree(c.Child[a]);
			}
		};
	}
	this.DebugPolyCount += c.Triangles.length;
};
CL3D.OctTreeTriangleSelector.prototype.getAllTriangles = function (a, b) {
	CL3D.MeshTriangleSelector.prototype.getAllTriangles.call(this, a, b);
};
CL3D.OctTreeTriangleSelector.prototype.getTrianglesInBox = function (e, b, d) {
	if (!this.Node.AbsoluteTransformation) {
		return;
	}
	var c = new CL3D.Matrix4();
	var a = e.clone();
	if (this.Node) {
		c = this.Node.getAbsoluteTransformation().clone();
		c.makeInverse();
		c.transformBoxEx(a);
	}
	c.makeIdentity();
	if (b) {
		c = b.clone();
	}
	if (this.Node) {
		c = c.multiply(this.Node.getAbsoluteTransformation());
	}
	if (this.Root) {
		this.getTrianglesFromOctTree(this.Root, d, a, c);
	}
};
CL3D.OctTreeTriangleSelector.prototype.getTrianglesFromOctTree = function (g, e, f, a) {
	if (!g.Box.intersectsWithBox(f)) {
		return;
	}
	var d = g.Triangles.length;
	var b;
	if (a.isIdentity()) {
		for (b = 0; b < d; ++b) {
			e.push(g.Triangles[b]);
		}
	} else {
		if (a.isTranslateOnly()) {
			for (b = 0; b < d; ++b) {
				e.push(new CL3D.Triangle3d(a.getTranslatedVect(g.Triangles[b].pointA), a.getTranslatedVect(g.Triangles[b].pointB), a.getTranslatedVect(g.Triangles[b].pointC)));
			}
		} else {
			for (b = 0; b < d; ++b) {
				e.push(new CL3D.Triangle3d(a.getTransformedVect(g.Triangles[b].pointA), a.getTransformedVect(g.Triangles[b].pointB), a.getTransformedVect(g.Triangles[b].pointC)));
			}
		};
	}
	for (b = 0; b < 8; ++b) {
		var h = g.Child[b];
		if (h != null) {
			this.getTrianglesFromOctTree(h, e, f, a);
		}
	};
};
