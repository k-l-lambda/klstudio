(window.webpackJsonp = window.webpackJsonp || []).push([
    [4], {
        36: function(e, a, t) {
            e.exports = {
                form: "_1OFhI"
            }
        },
        37: function(e, a, t) {
            e.exports = {
                select: "_1Zsh6"
            }
        },
        70: function(e, a, t) {
            "use strict";
            t.r(a);
            var l = t(0),
                n = t.n(l),
                r = t(19),
                s = t.n(r),
                i = t(14),
                c = (t(30), t(31), t(5)),
                o = (t(29), t(8)),
                m = t.n(o),
                d = t(36),
                p = t.n(d),
                u = t(21),
                E = t(6);
            var h = function() {
                return n.a.createElement("svg", {
                    xmlns: "http://www.w3.org/2000/svg",
                    id: "flag-icon-css-de",
                    viewBox: "0 0 512 512"
                }, n.a.createElement("path", {
                    fill: "#ffce00",
                    d: "M0 341.3h512V512H0z"
                }), n.a.createElement("path", {
                    d: "M0 0h512v170.7H0z"
                }), n.a.createElement("path", {
                    fill: "#d00",
                    d: "M0 170.7h512v170.6H0z"
                }))
            };
            var f = function() {
                return n.a.createElement("svg", {
                    xmlns: "http://www.w3.org/2000/svg",
                    id: "flag-icon-css-gb",
                    viewBox: "0 0 512 512"
                }, n.a.createElement("defs", null, n.a.createElement("clipPath", {
                    id: "a"
                }, n.a.createElement("path", {
                    fillOpacity: ".7",
                    d: "M250 0h500v500H250z"
                }))), n.a.createElement("g", {
                    clipPath: "url(#a)",
                    transform: "translate(-256) scale(1.024)"
                }, n.a.createElement("g", {
                    strokeWidth: "1pt"
                }, n.a.createElement("path", {
                    fill: "#012169",
                    d: "M0 0h1000v500H0z"
                }), n.a.createElement("path", {
                    fill: "#fff",
                    d: "M0 0v55.9L888.2 500H1000v-55.9L111.8.1H0zm1000 0v55.9L111.8 500H0v-55.9L888.2 0H1000z"
                }), n.a.createElement("path", {
                    fill: "#fff",
                    d: "M416.7 0v500h166.6V0H416.7zM0 166.7v166.6h1000V166.7H0z"
                }), n.a.createElement("path", {
                    fill: "#c8102e",
                    d: "M0 200v100h1000V200H0zM450 0v500h100V0H450zM0 500l333.3-166.7H408L74.5 500H0zM0 0l333.3 166.7h-74.5L0 37.3V0zm592.1 166.7L925.5 0h74.5L666.7 166.7H592zm408 333.3L666.6 333.3h74.5L1000 462.7V500z"
                }))))
            };
            var g = function() {
                return n.a.createElement("svg", {
                    xmlns: "http://www.w3.org/2000/svg",
                    id: "flag-icon-css-es",
                    viewBox: "0 0 512 512"
                }, n.a.createElement("path", {
                    fill: "#c60b1e",
                    d: "M0 0h512v512H0z"
                }), n.a.createElement("path", {
                    fill: "#ffc400",
                    d: "M0 128h512v256H0z"
                }))
            };
            var v = function() {
                return n.a.createElement("svg", {
                    xmlns: "http://www.w3.org/2000/svg",
                    id: "flag-icon-css-fr",
                    viewBox: "0 0 512 512"
                }, n.a.createElement("g", {
                    fillRule: "evenodd",
                    strokeWidth: "1pt"
                }, n.a.createElement("path", {
                    fill: "#fff",
                    d: "M0 0h512v512H0z"
                }), n.a.createElement("path", {
                    fill: "#00267f",
                    d: "M0 0h170.7v512H0z"
                }), n.a.createElement("path", {
                    fill: "#f31830",
                    d: "M341.3 0H512v512H341.3z"
                })))
            };
            var w = function() {
                return n.a.createElement("svg", {
                    xmlns: "http://www.w3.org/2000/svg",
                    id: "flag-icon-css-it",
                    viewBox: "0 0 512 512"
                }, n.a.createElement("g", {
                    fillRule: "evenodd",
                    strokeWidth: "1pt"
                }, n.a.createElement("path", {
                    fill: "#fff",
                    d: "M0 0h512v512H0z"
                }), n.a.createElement("path", {
                    fill: "#009246",
                    d: "M0 0h170.7v512H0z"
                }), n.a.createElement("path", {
                    fill: "#ce2b37",
                    d: "M341.3 0H512v512H341.3z"
                })))
            };
            var R = function() {
                    return n.a.createElement("svg", {
                        xmlns: "http://www.w3.org/2000/svg",
                        xmlnsXlink: "http://www.w3.org/1999/xlink",
                        id: "flag-icon-css-pt",
                        viewBox: "0 0 512 512"
                    }, n.a.createElement("path", {
                        fill: "red",
                        d: "M204.8 0H512v512H204.7z"
                    }), n.a.createElement("path", {
                        fill: "#060",
                        d: "M0 0h204.8v512H-.1z"
                    }))
                },
                b = t(20),
                H = t(37),
                z = t.n(H);

            function M({
                options: e,
                id: a = "id",
                label: t = "label",
                value: l,
                onChange: r = (() => {})
            }) {
                return n.a.createElement("select", {
                    className: z.a.select,
                    onChange: function(a) {
                        r(e[a.target.value])
                    },
                    disabled: !e
                }, e && e.map((e, r) => n.a.createElement("option", {
                    key: e[a] || r,
                    value: r,
                    selected: l && e[a] === l
                }, e[t])))
            }
            var N = t(15);

            function I(e, a, t) {
                return a in e ? Object.defineProperty(e, a, {
                    value: t,
                    enumerable: !0,
                    configurable: !0,
                    writable: !0
                }) : e[a] = t, e
            }
            const S = {
                    GRANTED: "granted",
                    NOT_GRANTED: "notGranted",
                    PARTIAL: "partial",
                    ERROR: "error"
                },
                C = [{
                    icon: f,
                    code: "en",
                    label: "English"
                }, {
                    icon: g,
                    code: "es",
                    label: "Español"
                }, {
                    icon: R,
                    code: "pt",
                    label: "Português"
                }, {
                    icon: v,
                    code: "fr",
                    label: "Français"
                }, {
                    icon: h,
                    code: "de",
                    label: "Deutsch"
                }, {
                    icon: w,
                    code: "it",
                    label: "Italiano"
                }];
            const k = Object(i.b)()(class extends n.a.Component {
                constructor(...e) {
                    super(...e), I(this, "state", {
                        permissionRequested: !1,
                        preferredCameraId: localStorage.getItem("preferredCameraId"),
                        preferredCameraResolutionId: localStorage.getItem("preferredCameraResolutionId")
                    }), I(this, "setPreferredCamera", e => {
                        localStorage.setItem("preferredCameraId", e.deviceId), localStorage.setItem("preferredCameraLabel", e.label), this.setState({
                            preferredCameraId: e.id
                        })
                    }), I(this, "setPreferredResolution", e => {
                        localStorage.setItem("preferredCameraResolutionId", e.id), this.setState({
                            preferredCameraResolutionId: e.id
                        })
                    })
                }
                componentDidMount() {
                    this.setState({
                        permissionRequested: !0
                    }), navigator.getUserMedia({
                        audio: !0,
                        video: {
                            width: 1280,
                            height: 720
                        }
                    }, e => {
                        const a = e.getTracks(),
                            t = !!a.find(e => "audio" === e.kind),
                            l = !!a.find(e => "video" === e.kind);
                        l && t ? this.setState({
                            permissionRequested: !1,
                            permissionState: S.GRANTED
                        }) : this.setState({
                            permissionRequested: !1,
                            permissionState: S.PARTIAL,
                            hasVideo: l,
                            hasAudio: t
                        }), navigator.mediaDevices.enumerateDevices().then(e => {
                            const a = e.filter(e => "videoinput" === e.kind);
                            this.setState({
                                cameras: a
                            })
                        }).catch(console.error), a.forEach(e => e.stop())
                    }, e => {
                        "NotAllowedError" === e.name ? this.setState({
                            permissionRequested: !1,
                            permissionState: S.NOT_GRANTED
                        }) : this.setState({
                            permissionRequested: !1,
                            permissionState: S.ERROR,
                            errorDetail: e.name
                        })
                    })
                }
                render() {
                    const e = this.props,
                        a = e.t,
                        t = e.i18n,
                        l = this.state,
                        r = l.permissionRequested,
                        s = l.permissionState,
                        i = l.hasVideo,
                        o = l.hasAudio,
                        d = l.errorDetail,
                        h = l.cameras,
                        f = l.preferredCameraId,
                        g = l.preferredCameraResolutionId;
                    return n.a.createElement("div", {
                        className: m.a.options
                    }, n.a.createElement(u.a, {
                        showVersion: !0
                    }), n.a.createElement(c.a, {
                        className: m.a.message
                    }, n.a.createElement("div", null, n.a.createElement("span", {
                        className: m.a.title
                    }, n.a.createElement("h2", null, a("Recording permission"))), r && n.a.createElement(E.a, {
                        type: E.a.INFO
                    }, a("Please grant permission")), s === S.GRANTED && n.a.createElement(E.a, {
                        type: E.a.SUCCESS
                    }, a("Permission granted")), s === S.PARTIAL && n.a.createElement(E.a, {
                        type: E.a.ERROR
                    }, a("Permission partially granted"), ":", n.a.createElement("br", null), a("Audio"), ": ", o ? "✓" : "✗", n.a.createElement("br", null), a("Video"), ": ", i ? "✓" : "✗", n.a.createElement("br", null)), s === S.NOT_GRANTED && n.a.createElement(E.a, {
                        type: E.a.ERROR
                    }, a("Permission denied")), s === S.ERROR && n.a.createElement(E.a, {
                        type: E.a.ERROR
                    }, a("Error getting media stream"), ": ", d))), n.a.createElement(c.a, {
                        className: m.a.message,
                        delay: 200
                    }, n.a.createElement("div", null, n.a.createElement("span", {
                        className: m.a.title
                    }, n.a.createElement("h2", null, a("Settings"))), n.a.createElement("div", {
                        className: p.a.form
                    }, n.a.createElement("div", null, a("Preferred camera"), ":"), n.a.createElement("div", null, n.a.createElement(M, {
                        options: h,
                        value: f,
                        id: "deviceId",
                        onChange: e => this.setPreferredCamera(e)
                    })), n.a.createElement("div", null, a("Camera resolution"), ":"), n.a.createElement("div", null, n.a.createElement(M, {
                        options: N.a,
                        value: g,
                        onChange: e => this.setPreferredResolution(e)
                    }))))), n.a.createElement(c.a, {
                        className: m.a.message,
                        delay: 400
                    }, n.a.createElement("div", null, n.a.createElement("span", {
                        className: m.a.title
                    }, n.a.createElement("h2", null, a("Language"))), n.a.createElement("div", {
                        className: m.a.languages
                    }, C.map(e => n.a.createElement("div", {
                        key: e.code
                    }, n.a.createElement(b.a, {
                        onClick: () => t.changeLanguage(e.code),
                        active: t.language === e.code,
                        icon: e.icon,
                        label: e.label,
                        localize: !1
                    }, e.label)))))), n.a.createElement(c.a, {
                        className: m.a.message,
                        delay: 400
                    }, n.a.createElement("div", null, n.a.createElement("span", {
                        className: m.a.title
                    }, n.a.createElement("h2", null, a("About"))), n.a.createElement("p", null, a("description")), n.a.createElement("p", null, a("Designed and Developed by"), ":"), n.a.createElement("ul", {
                        className: m.a.team
                    }, n.a.createElement("li", null, n.a.createElement("a", {
                        href: "https://erichbehrens.com/",
                        target: "_blank"
                    }, n.a.createElement("i", null, "Erich Behrens")), n.a.createElement("span", null, a("Developer"))), n.a.createElement("li", null, n.a.createElement("a", {
                        href: "https://www.riangle.com/",
                        target: "_blank"
                    }, n.a.createElement("i", null, "Luan Gjokaj")), n.a.createElement("span", null, a("Designer")))))))
                }
            });
            s.a.render(n.a.createElement(l.Suspense, {
                fallback: n.a.createElement("div", null)
            }, n.a.createElement(k, null)), document.getElementById("app")), setTimeout(() => {
                window._gaq && (window._gaq.push(["_setAccount", "UA-114990894-1"]), window._gaq.push(["_trackPageview"]))
            }, 1e3)
        },
        8: function(e, a, t) {
            e.exports = {
                options: "aiOJz",
                languages: "_3Nw3t",
                message: "vs2MV",
                title: "_2mdV6",
                team: "_3bzx0"
            }
        }
    },
    [
        [70, 1, 2, 0]
    ]
]);
