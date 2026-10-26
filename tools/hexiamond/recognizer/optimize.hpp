// scipy.optimize ports used by the recognizer, kept step-for-step so the search follows the notebook:
// Nelder-Mead (minimize(method="Nelder-Mead")) and Powell with Brent line searches (minimize(method="Powell")).
#pragma once

#include <algorithm>
#include <cmath>
#include <limits>
#include <numeric>
#include <vector>

namespace hx {

using Vec = std::vector<double>;

// scipy _minimize_neldermead, non-adaptive coefficients, initial simplex 5% (or 0.00025 for zeros).
template <typename F>
Vec nelderMead (F&& func, const Vec& x0, double xatol, double fatol, int maxiter) {
	const double rho = 1, chi = 2, psi = 0.5, sigma = 0.5;
	const size_t n = x0.size();
	std::vector<Vec> sim(n + 1, x0);
	for (size_t k = 0; k < n; k++)
		sim[k + 1][k] = sim[k + 1][k] != 0 ? (1 + 0.05) * sim[k + 1][k] : 0.00025;
	Vec fsim(n + 1);
	for (size_t k = 0; k <= n; k++)
		fsim[k] = func(sim[k]);
	auto sortSimplex = [&]() {
		std::vector<size_t> order(n + 1);
		std::iota(order.begin(), order.end(), 0);
		std::stable_sort(order.begin(), order.end(), [&](size_t a, size_t b) { return fsim[a] < fsim[b]; });
		std::vector<Vec> s2(n + 1);
		Vec f2(n + 1);
		for (size_t i = 0; i <= n; i++) {
			s2[i] = sim[order[i]];
			f2[i] = fsim[order[i]];
		}
		sim.swap(s2);
		fsim.swap(f2);
	};
	sortSimplex();
	Vec xbar(n), xr(n), xe(n), xc(n);
	for (int iterations = 1; iterations < maxiter; iterations++) {
		double xspread = 0, fspread = 0;
		for (size_t j = 1; j <= n; j++) {
			for (size_t i = 0; i < n; i++)
				xspread = std::max(xspread, std::fabs(sim[j][i] - sim[0][i]));
			fspread = std::max(fspread, std::fabs(fsim[0] - fsim[j]));
		}
		if (xspread <= xatol && fspread <= fatol)
			break;
		for (size_t i = 0; i < n; i++) {
			xbar[i] = 0;
			for (size_t j = 0; j < n; j++)
				xbar[i] += sim[j][i];
			xbar[i] /= double(n);
		}
		for (size_t i = 0; i < n; i++)
			xr[i] = (1 + rho) * xbar[i] - rho * sim[n][i];
		double fxr = func(xr);
		bool shrink = false;
		if (fxr < fsim[0]) {
			for (size_t i = 0; i < n; i++)
				xe[i] = (1 + rho * chi) * xbar[i] - rho * chi * sim[n][i];
			double fxe = func(xe);
			if (fxe < fxr) {
				sim[n] = xe;
				fsim[n] = fxe;
			}
			else {
				sim[n] = xr;
				fsim[n] = fxr;
			}
		}
		else if (fxr < fsim[n - 1]) {
			sim[n] = xr;
			fsim[n] = fxr;
		}
		else if (fxr < fsim[n]) {
			for (size_t i = 0; i < n; i++)
				xc[i] = (1 + psi * rho) * xbar[i] - psi * rho * sim[n][i];
			double fxc = func(xc);
			if (fxc <= fxr) {
				sim[n] = xc;
				fsim[n] = fxc;
			}
			else
				shrink = true;
		}
		else {
			for (size_t i = 0; i < n; i++)
				xc[i] = (1 - psi) * xbar[i] + psi * sim[n][i];
			double fxcc = func(xc);
			if (fxcc < fsim[n]) {
				sim[n] = xc;
				fsim[n] = fxcc;
			}
			else
				shrink = true;
		}
		if (shrink) {
			for (size_t j = 1; j <= n; j++) {
				for (size_t i = 0; i < n; i++)
					sim[j][i] = sim[0][i] + sigma * (sim[j][i] - sim[0][i]);
				fsim[j] = func(sim[j]);
			}
		}
		sortSimplex();
	}
	return sim[0];
}

// scipy.optimize.bracket; returns false where scipy raises BracketError (the caller then takes the best of the three).
template <typename F>
bool bracket (F&& func, double& xa, double& xb, double& xc, double& fa, double& fb, double& fc) {
	const double gold = 1.618034, verySmall = 1e-21, growLimit = 110.0;
	xa = 0.0;
	xb = 1.0;
	fa = func(xa);
	fb = func(xb);
	if (fa < fb) {
		std::swap(xa, xb);
		std::swap(fa, fb);
	}
	xc = xb + gold * (xb - xa);
	fc = func(xc);
	int iter = 0;
	while (fc < fb) {
		double tmp1 = (xb - xa) * (fb - fc);
		double tmp2 = (xb - xc) * (fb - fa);
		double val = tmp2 - tmp1;
		double denom = std::fabs(val) < verySmall ? 2.0 * verySmall : 2.0 * val;
		double w = xb - ((xb - xc) * tmp2 - (xb - xa) * tmp1) / denom;
		double wlim = xb + growLimit * (xc - xb);
		if (iter > 1000)
			return false;
		iter++;
		double fw;
		if ((w - xc) * (xb - w) > 0.0) {
			fw = func(w);
			if (fw < fc) {
				xa = xb;
				xb = w;
				fa = fb;
				fb = fw;
				break;
			}
			else if (fw > fb) {
				xc = w;
				fc = fw;
				break;
			}
			w = xc + gold * (xc - xb);
			fw = func(w);
		}
		else if ((w - wlim) * (wlim - xc) >= 0.0) {
			w = wlim;
			fw = func(w);
		}
		else if ((w - wlim) * (xc - w) > 0.0) {
			fw = func(w);
			if (fw < fc) {
				xb = xc;
				xc = w;
				w = xc + gold * (xc - xb);
				fb = fc;
				fc = fw;
				fw = func(w);
			}
		}
		else {
			w = xc + gold * (xc - xb);
			fw = func(w);
		}
		xa = xb;
		xb = xc;
		xc = w;
		fa = fb;
		fb = fc;
		fc = fw;
	}
	bool cond1 = (fb < fc && fb <= fa) || (fb < fa && fb <= fc);
	bool cond2 = (xa < xb && xb < xc) || (xc < xb && xb < xa);
	bool cond3 = std::isfinite(xa) && std::isfinite(xb) && std::isfinite(xc);
	return cond1 && cond2 && cond3;
}

// scipy Brent (minimize_scalar(method="brent")), bracket from (0, 1); returns alpha, sets fmin.
template <typename F>
double brent (F&& func, double tol, double& fmin) {
	double xa, xb, xc, fa, fb, fc;
	if (!bracket(func, xa, xb, xc, fa, fb, fc)) {
		// _recover_from_bracket_error: best of the three points.
		double xs[3] = {xa, xb, xc}, fs[3] = {fa, fb, fc};
		if (std::isnan(xa) || std::isnan(xb) || std::isnan(xc) || std::isnan(fa) || std::isnan(fb) || std::isnan(fc)) {
			fmin = std::numeric_limits<double>::quiet_NaN();
			return fmin;
		}
		int best = int(std::min_element(fs, fs + 3) - fs);
		fmin = fs[best];
		return xs[best];
	}
	const double mintol = 1.0e-11, cg = 0.3819660;
	double x = xb, w = xb, v = xb, fw = fb, fv = fb, fx = fb;
	double a = xa < xc ? xa : xc, b = xa < xc ? xc : xa;
	double deltax = 0.0, rat = 0.0;
	for (int iter = 0; iter < 500; iter++) {
		double tol1 = tol * std::fabs(x) + mintol;
		double tol2 = 2.0 * tol1;
		double xmid = 0.5 * (a + b);
		if (std::fabs(x - xmid) < (tol2 - 0.5 * (b - a)))
			break;
		if (std::fabs(deltax) <= tol1) {
			deltax = x >= xmid ? a - x : b - x;
			rat = cg * deltax;
		}
		else {
			double tmp1 = (x - w) * (fx - fv);
			double tmp2 = (x - v) * (fx - fw);
			double p = (x - v) * tmp2 - (x - w) * tmp1;
			tmp2 = 2.0 * (tmp2 - tmp1);
			if (tmp2 > 0.0)
				p = -p;
			tmp2 = std::fabs(tmp2);
			double dxTemp = deltax;
			deltax = rat;
			if (p > tmp2 * (a - x) && p < tmp2 * (b - x) && std::fabs(p) < std::fabs(0.5 * tmp2 * dxTemp)) {
				rat = p * 1.0 / tmp2;
				double u = x + rat;
				if ((u - a) < tol2 || (b - u) < tol2)
					rat = xmid - x >= 0 ? tol1 : -tol1;
			}
			else {
				deltax = x >= xmid ? a - x : b - x;
				rat = cg * deltax;
			}
		}
		double u = std::fabs(rat) < tol1 ? (rat >= 0 ? x + tol1 : x - tol1) : x + rat;
		double fu = func(u);
		if (fu > fx) {
			if (u < x)
				a = u;
			else
				b = u;
			if (fu <= fw || w == x) {
				v = w;
				w = u;
				fv = fw;
				fw = fu;
			}
			else if (fu <= fv || v == x || v == w) {
				v = u;
				fv = fu;
			}
		}
		else {
			if (u >= x)
				a = x;
			else
				b = x;
			v = w;
			w = x;
			x = u;
			fv = fw;
			fw = fx;
			fx = fu;
		}
	}
	fmin = fx;
	return x;
}

// scipy _minimize_powell, unbounded, direction set starting from the identity.
template <typename F>
Vec powell (F&& func, const Vec& x0, double xtol, double ftol, int maxiter) {
	const size_t n = x0.size();
	std::vector<Vec> direc(n, Vec(n, 0.0));
	for (size_t i = 0; i < n; i++)
		direc[i][i] = 1.0;
	Vec x = x0, x1 = x0, trial(n);
	double fval = func(x);
	auto lineSearch = [&](Vec& xi) {
		bool any = false;
		for (double v : xi)
			any = any || v != 0;
		if (!any)
			return;
		double fret;
		double alpha = brent([&](double a) {
			for (size_t i = 0; i < n; i++)
				trial[i] = x[i] + a * xi[i];
			return func(trial);
		}, xtol * 100, fret);
		for (size_t i = 0; i < n; i++) {
			xi[i] *= alpha;
			x[i] += xi[i];
		}
		fval = fret;
	};
	for (int iter = 0;;) {
		double fx = fval;
		size_t bigind = 0;
		double delta = 0.0;
		for (size_t i = 0; i < n; i++) {
			double fx2 = fval;
			lineSearch(direc[i]);
			if ((fx2 - fval) > delta) {
				delta = fx2 - fval;
				bigind = i;
			}
		}
		iter++;
		double bnd = ftol * (std::fabs(fx) + std::fabs(fval)) + 1e-20;
		if (2.0 * (fx - fval) <= bnd || iter >= maxiter || (std::isnan(fx) && std::isnan(fval)))
			break;
		Vec direc1(n), x2(n);
		for (size_t i = 0; i < n; i++) {
			direc1[i] = x[i] - x1[i];
			x2[i] = x[i] + direc1[i];
		}
		x1 = x;
		double fx2 = func(x2);
		if (fx > fx2) {
			double t = 2.0 * (fx + fx2 - 2.0 * fval);
			double temp = fx - fval - delta;
			t *= temp * temp;
			temp = fx - fx2;
			t -= delta * temp * temp;
			if (t < 0.0) {
				lineSearch(direc1);
				bool any = false;
				for (double v : direc1)
					any = any || v != 0;
				if (any) {
					direc[bigind] = direc[n - 1];
					direc[n - 1] = direc1;
				}
			}
		}
	}
	return x;
}

}
