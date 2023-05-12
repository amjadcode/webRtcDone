import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./eachuser.css";
import Makeinput from "../input/MakeInput";
function Eachuser() {
  let text = localStorage.getItem("messageapp");
  let localUser = JSON.parse(text);
  let theLocalNumber = localUser.user_phone;
  let [theRemoteNumber, setTheRemoteNumber] = useState("");
  const setUpRemoteNumber = (theNumber) => {
    setTheRemoteNumber(theNumber);
  };
  let localVideo = useRef();
  let remoteVideoContainer = useRef();
  let myConnection;
  var socket = io.connect("/");
  useEffect(() => {
    socket.emit("userInfoCome", { phoneNumber: theLocalNumber });
  }, []);

  //!call to other user
  let Calling = async () => {
    //!access the local media information
    const constraints = { video: true, audio: true };
    const localStream = await navigator.mediaDevices.getUserMedia(constraints);
    localVideo.current.srcObject = localStream;
    //!set up connection of web Rtc
    const servers = {
      iceServers: [
        {
          urls: [
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
          ],
        },
      ],
    };
    myConnection = new RTCPeerConnection(servers);
    let remoteStream = new MediaStream();
    localStream.getTracks().forEach((track) => {
      myConnection.addTrack(track, localStream);
    });
    //!remote video
    remoteVideoContainer.current.srcObject = remoteStream;
    myConnection.ontrack = function (event) {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    //!listening the local ice candidate and then send them
    myConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(event.candidate);
        socket.emit("localIceCandiateReady", {
          theCandidate: event.candidate,
          toSendIce: theRemoteNumber,
        });
      }
    };
    //////////////////////!!!!!!!!!
    const offer = await myConnection.createOffer();
    await myConnection.setLocalDescription(offer);
    //!the offer sending
    socket.emit("calling", {
      fromCall: theLocalNumber,
      toCall: theRemoteNumber,
      theOffer: offer,
    });
    //!after the answer is come
    socket.on("candidateReady", (data) => {
      myConnection.addIceCandidate(new RTCIceCandidate(data.iceCandidate));
    });
    socket.on("comeAnswer", (data) => {
      console.log("answer", data);
      myConnection.setRemoteDescription(
        new RTCSessionDescription(data.finalanswer)
      );
    });
  };
  //!call recieving process
  socket.on("call_incoming", async (data) => {
    //!access the local media information
    const constraints = { video: true, audio: true };
    const localStream = await navigator.mediaDevices.getUserMedia(constraints);
    localVideo.current.srcObject = localStream;
    //!set up connection of web Rtc
    const servers = {
      iceServers: [
        {
          urls: [
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
          ],
        },
      ],
    };
    myConnection = new RTCPeerConnection(servers);
    const mainOffer = new RTCSessionDescription(data.theOffer);
    myConnection.setRemoteDescription(mainOffer);
    let remoteStream = new MediaStream();
    localStream.getTracks().forEach((track) => {
      myConnection.addTrack(track, localStream);
    });
    //!remote video
    remoteVideoContainer.current.srcObject = remoteStream;
    myConnection.ontrack = function (event) {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    //!listening the local ice candidate and then send them
    myConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(event.candidate);
        //!sending the ice candidate to the other user
        socket.emit("localIceCandiateReady", {
          theCandidate: event.candidate,
          toSendIce: data.fromCall,
        });
      }
    };
    const answer = await myConnection.createAnswer();
    await myConnection.setLocalDescription(answer);
     socket.on("candidateReady", (data) => {
      myConnection.addIceCandidate(new RTCIceCandidate(data.iceCandidate));
    });
    socket.emit("callRecieved", { theAnswer: answer, toAnswer: data.fromCall });
  });
  return (
    <>
      <div className="userContainer">
        <h2>
          Your Id is: <span>{localUser.uid}</span>
        </h2>

        <h4>Your phone Number is: {localUser.user_phone}</h4>
        <hr />
      </div>
      <div className="callingUser">
        <Makeinput
          fortype="text"
          forplaceholder="Enter Other Phone Number: "
          forname="phonenumber"
          settingNumber={setUpRemoteNumber}
        />
        <button
          className="button"
          onClick={() => {
            Calling();
          }}
        >
          call
        </button>
        <video autoPlay ref={remoteVideoContainer} />
        <hr />
        <video autoPlay ref={localVideo} />
      </div>
    </>
  );
}
export default Eachuser;
