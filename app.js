(window.webpackJsonp = window.webpackJsonp || []).push([
    [3], {
        22: function(e, t, a) {
            e.exports = {
                buttons: "KtlMD"
            }
        },
        4: function(e, t, a) {
            e.exports = {
                app: "NghkZ",
                container: "_1h1fz",
                controls: "_2rB1t",
                title: "jrOXx",
                buttonContainer: "Jebbb",
                flex: "gSO-6",
                stop: "_3fkRL",
                recording: "_1lsRE",
                paused: "_1xIfF",
                back: "_1AmsF",
                video: "_3heFR",
                footer: "_1fwnD"
            }
        },
        71: function(e, t, a) {
            "use strict";
            a.r(t);
            var o = a(0),
                r = a.n(o),
                i = a(19),
                s = a.n(i),
                c = a(14),
                n = (a(29), a(4)),
                d = a.n(n),
                l = a(16),
                u = a(5),
                h = a(22),
                m = a.n(h),
                g = a(20);
            var p = function({
                    value: e,
                    isRecording: t,
                    onChange: a,
                    sources: i
                }) {
                    return r.a.createElement(o.Fragment, null, r.a.createElement(u.a, {
                        className: m.a.buttons
                    }, r.a.createElement("div", null, i.map(o => r.a.createElement(g.a, {
                        onClick: () => a(o.type),
                        className: e === o.type ? m.a.active : "",
                        active: e === o.type,
                        disabled: t || !1 === o.enabled,
                        icon: o.icon,
                        label: o.label,
                        key: o.type,
                        scaleEffect: !0
                    })))))
                },
                v = a(21),
                S = a(15),
                E = a(6);
            a(30), a(31);

            function b(e) {
                for (var t = 1; t < arguments.length; t++) {
                    var a = null != arguments[t] ? arguments[t] : {},
                        o = Object.keys(a);
                    "function" == typeof Object.getOwnPropertySymbols && (o = o.concat(Object.getOwnPropertySymbols(a).filter(function(e) {
                        return Object.getOwnPropertyDescriptor(a, e).enumerable
                    }))), o.forEach(function(t) {
                        w(e, t, a[t])
                    })
                }
                return e
            }

            function w(e, t, a) {
                return t in e ? Object.defineProperty(e, t, {
                    value: a,
                    enumerable: !0,
                    configurable: !0,
                    writable: !0
                }) : e[t] = a, e
            }
            const k = [{
                    type: "screen",
                    icon: l.b,
                    label: "Screen"
                }, {
                    type: "camera",
                    icon: l.a,
                    label: "Camera"
                }],
                y = [{
                    type: "none",
                    icon: l.e,
                    label: "None"
                }, {
                    type: "mic",
                    icon: l.d,
                    label: "Microphone"
                }, {
                    type: "system",
                    icon: l.f,
                    label: "System",
                    filter: ["screen"]
                }];

            function f(e) {
                chrome.runtime.openOptionsPage(), console.log("getUserMedia() failed", e.name, e)
            }

            function R(e) {
                window._gaq && window._gaq.push(e)
            }
            const A = Object(c.b)()(class extends r.a.Component {
                constructor(...e) {
                    super(...e), w(this, "state", {
                        isRecording: !1,
                        includeAudioMic: !1,
                        includeAudioSystem: !1,
                        hasSource: !1,
                        videoSource: void 0,
                        audioSource: "none",
                        error: void 0
                    }), w(this, "audioStream", void 0), w(this, "recorder", void 0), w(this, "localStream", void 0), w(this, "streams", void 0), w(this, "recordedChunks", []), w(this, "setVideoSource", e => {
                        const t = this.getAudioSources(e).find(e => e.type === this.state.audioSource && e.enabled);
                        this.setState({
                            videoSource: e,
                            audioSource: t ? t.type : y[0].type,
                            error: void 0
                        })
                    }), w(this, "setAudioSource", e => {
                        switch (R(["_trackEvent", "video", "setAudio", e]), this.setState({
                            error: void 0
                        }), e) {
                            case "mic":
                                this.setState({
                                    includeAudioMic: !0,
                                    includeAudioSystem: !1,
                                    audioSource: e
                                }), navigator.getUserMedia({
                                    audio: !0,
                                    video: !1
                                }, this.gotAudio, f);
                                break;
                            case "system":
                                this.setState({
                                    includeAudioMic: !1,
                                    includeAudioSystem: !0,
                                    audioSource: e
                                });
                                break;
                            default:
                                this.setState({
                                    includeAudioMic: !1,
                                    includeAudioSystem: !1,
                                    audioSource: e
                                })
                        }
                    }), w(this, "record", () => {
                        if (console.log("Start recording"), R(["_trackEvent", "video", "recordingStarted", this.state.videoSource]), this.video && (this.video.muted = !0), this.setState({
                                hasStarted: !0,
                                error: void 0
                            }), window.outerHeight < 710) {
                            const e = 710 - window.outerHeight;
                            window.resizeTo(window.outerWidth, 710), window.moveTo(window.screenLeft, window.screenTop - e / 2)
                        }
                        this.recordedChunks = [];
                        const e = ["screen", "window", "tab"];
                        switch (this.state.videoSource) {
                            case "window":
                            case "screen":
                            case "tab":
                                this.state.includeAudioSystem && e.push("audio"), this.state.includeAudioMic && navigator.getUserMedia({
                                    audio: !0,
                                    video: !1
                                }, this.gotAudio, f), chrome.desktopCapture.chooseDesktopMedia(e, this.onAccessApproved);
                                break;
                            case "camera": {
                                const e = {
                                        audio: !1,
                                        video: {
                                            width: 1280,
                                            height: 720
                                        }
                                    },
                                    t = localStorage.getItem("preferredCameraId");
                                t && (e.video.deviceId = t);
                                const a = localStorage.getItem("preferredCameraResolutionId");
                                a && (e.video = b({}, e.video, Object(S.d)(a).value)), navigator.getUserMedia(e, this.gotMediaStream, f)
                            }
                        }
                    }), w(this, "onAccessApproved", e => {
                        e ? navigator.mediaDevices.getUserMedia({
                            audio: {
                                mandatory: {
                                    chromeMediaSource: "desktop",
                                    chromeMediaSourceId: e,
                                    echoCancellation: !0
                                }
                            },
                            video: {
                                mandatory: {
                                    chromeMediaSource: "desktop",
                                    chromeMediaSourceId: e,
                                    maxWidth: window.screen.width,
                                    maxHeight: window.screen.height
                                }
                            }
                        }).catch(f).then(this.gotMediaStream) : console.log("Access to media rejected")
                    }), w(this, "gotMediaStream", e => {
                        if (console.log("Received local stream"), this.state.includeAudioSystem && (console.log("Checking for system audio track"), e.getAudioTracks().length < 1)) return console.log("No audio track in screen stream"), e.getTracks().forEach(e => e.stop()), this.setState({
                            error: S.b.SYSTEM_AUDIO_NOT_RECEIVED
                        }), void chrome.runtime.sendMessage({
                            type: S.c
                        });
                        if (this.localStream = e, e.getTracks().forEach(t => {
                                t.addEventListener("ended", () => {
                                    console.log(e.id, "track ended", t.kind, t.id), this.stopRecording()
                                })
                            }), this.state.includeAudioMic) {
                            console.log("Adding mic audio track");
                            const e = this.audioStream.getAudioTracks();
                            this.localStream.addTrack(e[0])
                        }
                        this.streams = [this.localStream, e, this.audioStream];
                        try {
                            this.recorder = new MediaRecorder(this.localStream, {
                                mimeType: "video/webm;codecs=h264"
                            })
                        } catch (e) {
                            return void console.error("Error creating MediaRecorder", e)
                        }
                        this.recorder.ondataavailable = this.recorderOnDataAvailable, this.recorder.onstop = this.recorderOnStop, this.recorder.start(), this.setState({
                            hasSource: !0
                        }, () => {
                            this.video.srcObject = this.localStream
                        }), this.setState({
                            isRecording: !0,
                            isPaused: !1
                        })
                    }), w(this, "gotAudio", e => {
                        console.log("Received audio stream"), this.audioStream = e, e.getTracks().forEach(t => {
                            t.addEventListener("ended", () => {
                                console.log(e.id, "track ended", t.kind, t.id)
                            })
                        })
                    }), w(this, "recorderOnDataAvailable", e => {
                        e.data && e.data.size > 0 && this.recordedChunks.push(e.data)
                    }), w(this, "recorderOnStop", () => {
                        const e = new Blob(this.recordedChunks, {
                                type: "video/webm;codecs=h264"
                            }),
                            t = URL.createObjectURL(e);
                        this.video.srcObject = null, this.setState({
                            isRecording: !1,
                            hasSource: !0,
                            src: t
                        }), chrome.runtime.sendMessage({
                            type: S.c
                        })
                    }), w(this, "stopRecording", () => {
                        console.log("Stop recording", this.recorder.state), "inactive" !== this.recorder.state && (this.recorder.stop(), this.streams.forEach(e => {
                            e && e.getTracks().forEach(e => {
                                e.stop()
                            })
                        }), this.streams = null, this.setState({
                            isRecording: !1,
                            isPaused: !1
                        }), R(["_trackEvent", "video", "recordingStopped"]))
                    }), w(this, "pauseRecording", () => {
                        console.log("Pause recording"), this.recorder.pause(), this.video.pause(), this.setState({
                            isPaused: !0
                        }), R(["_trackEvent", "video", "recordingPaused"])
                    }), w(this, "resumeRecording", () => {
                        console.log("Resume recording"), this.recorder.resume(), this.video.play(), this.setState({
                            isPaused: !1
                        }), R(["_trackEvent", "video", "recordingResumed"])
                    }), w(this, "save", () => {
                        ! function(e, t) {
                            const a = new Blob(e, {
                                    type: "video/webm"
                                }),
                                o = URL.createObjectURL(a),
                                r = document.createElement("a");
                            document.body.appendChild(r), r.style = "display: none", r.target = "_blank", r.href = o, r.download = t, r.click(), setTimeout(() => {
                                document.body.removeChild(r), window.URL.revokeObjectURL(o)
                            }, 100)
                        }(this.recordedChunks, "screen-capture.webm"), R(["_trackEvent", "video", "saved"])
                    }), w(this, "reset", () => {
                        this.setState({
                            hasSource: !1,
                            videoSource: void 0,
                            src: void 0
                        })
                    }), w(this, "openOptionsPage", () => {
                        chrome.runtime.openOptionsPage()
                    }), w(this, "getAudioSources", e => y.map(t => b({}, t, {
                        enabled: !t.filter || t.filter.includes(e)
                    })))
                }
                render() {
                    const e = this.props.t,
                        t = this.state,
                        a = t.isRecording,
                        i = t.videoSource,
                        s = t.audioSource,
                        c = t.hasSource,
                        n = t.src,
                        l = t.hasStarted,
                        h = t.isPaused,
                        m = t.error;
                    return r.a.createElement("div", {
                        className: d.a.container
                    }, r.a.createElement("div", {
                        className: `${d.a.app} ${l||a?d.a.recording:""}`
                    }, r.a.createElement(v.a, null), !c && r.a.createElement("div", null, r.a.createElement(u.a, {
                        className: d.a.controls,
                        delay: 300
                    }, r.a.createElement("div", null, r.a.createElement("span", {
                        className: d.a.title
                    }, r.a.createElement("h2", null, e("whatCapture"))), r.a.createElement(p, {
                        value: i,
                        isRecording: a,
                        onChange: this.setVideoSource,
                        sources: k
                    }))), i && r.a.createElement(u.a, {
                        className: d.a.controls,
                        delay: 400
                    }, r.a.createElement("div", null, r.a.createElement("span", {
                        className: d.a.title
                    }, r.a.createElement("h2", null, e("recordAudio"))), r.a.createElement(p, {
                        value: s,
                        isRecording: a,
                        onChange: this.setAudioSource,
                        sources: this.getAudioSources(i)
                    }), m === S.b.SYSTEM_AUDIO_NOT_RECEIVED && r.a.createElement(E.a, {
                        type: E.a.ERROR
                    }, r.a.createElement("strong", null, "Error:"), " could not receive System audio stream.", r.a.createElement("br", null), "Screen audio is available on Windows, other platforms support Tab audio only."))), !a && i && r.a.createElement(u.a, {
                        className: d.a.buttonContainer,
                        delay: 500
                    }, r.a.createElement("div", null, r.a.createElement("button", {
                        onClick: this.record
                    }, e("Start Recording"))))), c && r.a.createElement(u.a, {
                        className: `${d.a.buttonContainer} ${d.a.flex}`
                    }, r.a.createElement("div", null, a && r.a.createElement(o.Fragment, null, r.a.createElement("button", {
                        onClick: this.stopRecording,
                        className: d.a.stop
                    }, r.a.createElement("i", {
                        className: h ? d.a.paused : ""
                    }), e("Stop Recording")), !h && r.a.createElement("button", {
                        onClick: this.pauseRecording,
                        className: d.a.pause
                    }, r.a.createElement("i", null), e("Pause Recording")), h && r.a.createElement("button", {
                        onClick: this.resumeRecording,
                        className: d.a.resume
                    }, r.a.createElement("i", null), e("Resume Recording"))), !a && r.a.createElement(o.Fragment, null, r.a.createElement("button", {
                        onClick: this.save
                    }, e("Save")), r.a.createElement("button", {
                        onClick: this.reset,
                        className: d.a.back
                    }, e("New Recording"))))), c && r.a.createElement(u.a, {
                        className: d.a.video,
                        delay: 300
                    }, r.a.createElement("div", null, r.a.createElement("video", {
                        autoPlay: a,
                        muted: !0,
                        ref: e => {
                            this.video = e
                        },
                        src: n,
                        controls: !a
                    })))), r.a.createElement(u.a, {
                        className: d.a.footer,
                        delay: 500
                    }, r.a.createElement("footer", null, r.a.createElement("a", {
                        onClick: this.openOptionsPage
                    }, e("About Screen Recorder")))))
                }
            });
            s.a.render(r.a.createElement(o.Suspense, {
                fallback: r.a.createElement("div", null)
            }, r.a.createElement(A, null)), document.getElementById("app")), setTimeout(() => {
                R(["_setAccount", "UA-114990894-1"]), R(["_trackPageview"])
            }, 1e3)
        }
    },
    [
        [71, 1, 2, 0]
    ]
]);
