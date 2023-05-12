let localStream;
let remoteStream;
let peerConnection;
let localUserPhone;
let otherUserPhone;
let socket = io();
const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};
let init = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });

  document.getElementById("user-1").srcObject = localStream;
  peerConnection = new RTCPeerConnection(servers);
  localStream.getTracks().forEach(async (track) => {
    console.log("calling side local video: ", localStream);

    peerConnection.addTrack(track, localStream);
  });
  peerConnection.ontrack = async (event) => {
    console.log(event.streams);
    const [remoteStream] = event.streams;
    console.log("calling side remote video:", remoteStream);

    document.getElementById("user-2").srcObject = remoteStream;
    // event.streams[0].getTracks().forEach((track) => {
    //   console.log("calling side remote video: ", track);
    //    const [remoteStream] = event.streams;
    //    remoteVideo.srcObject = remoteStream;
    //   document.getElementById("user-2").srcObject = track;
    // });
  };
  //!after call come
  socket.on("comedAnswer", async (data) => {
    console.log("answer from recieving side: ", data);
    peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.finalanswer)
    );
  });
  //!send the ice candidate to other user
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("ice candidate from calling side: ", event.candidate);
      socket.emit("ice-candidate", {
        toice: otherUserPhone,
        candidate: event.candidate,
      });
    }
  };
  let offer = await peerConnection.createOffer();

  socket.emit("calltoOtherUser", {
    fromCall: localUserPhone,
    toCall: otherUserPhone,
    theOffer: offer,
  });
  await peerConnection.setLocalDescription(offer);
  socket.on("candidateReady", (data) => {
    console.log("ice candidate from calling side: ", data);
    let thecandidate = new RTCIceCandidate(data.iceCandidate);

    if (peerConnection.remoteDescription !== null) {
      peerConnection.addIceCandidate(thecandidate);
    } else {
      // Wait for the remote description to be set before adding ICE candidates
      peerConnection.onsetremotedescription = function () {
        peerConnection.addIceCandidate(thecandidate);
      };
    }
  });
};

//!-----------call to other user
document.getElementById("calling").onclick = () => {
  //call to other user
  otherUserPhone = document.getElementById("otheruserphone").value;
  init();
};
///!recieve the other user
socket.on("call_incoming", async (data) => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  console.log("local video", localStream);
  document.getElementById("user-1").srcObject = localStream;
  peerConnection = new RTCPeerConnection(servers);
  //!add the offer
  const mainOffer = new RTCSessionDescription(data.theOffer);
  peerConnection.setRemoteDescription(mainOffer);
  localStream.getTracks().forEach(async (track) => {
    console.log("recieving side local video: ", localStream);
    peerConnection.addTrack(track, localStream);
  });
  peerConnection.ontrack = async (event) => {
    const [remoteStream] = event.streams;
    console.log("recieving side remote video:", remoteStream);
    document.getElementById("user-2").srcObject = remoteStream;
    // event.streams[0].getTracks().forEach((track) => {
    //   console.log("recieving side remote video: ", track);
    //   document.getElementById("user-2").srcObject = track;
    // });
  };
  //!send the ice candidate to other user
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("ice candidate from recieving side: ", event.candidate);
      socket.emit("ice-candidate", {
        toice: data.fromCall,
        candidate: event.candidate,
      });
    }
  };
  socket.on("candidateReady", (data) => {
    console.log("ice candidate from calling side: ", data);
    let thecandidate = new RTCIceCandidate(data.iceCandidate);

    if (peerConnection.remoteDescription !== null) {
      peerConnection.addIceCandidate(thecandidate);
    } else {
      // Wait for the remote description to be set before adding ICE candidates
      peerConnection.onsetremotedescription = function () {
        peerConnection.addIceCandidate(thecandidate);
      };
    }
  });
  const answer = await peerConnection.createAnswer();
  console.log("answer: ", answer);
  socket.emit("callRecieved", { theAnswer: answer, toAnswer: data.fromCall });
  await peerConnection.setLocalDescription(answer);
});

document.getElementById("setlocalphone").onclick = () => {
  localUserPhone = document.getElementById("localuser").value;
  document.getElementById("localnumber").innerHTML = localUserPhone;
  socket.emit("userphonegrab", { phoneNumber: localUserPhone });
};
