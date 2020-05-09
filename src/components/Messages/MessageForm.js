import React, { useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Segment, Button, Input } from "semantic-ui-react";
import firebase from "../../firebase";
import FileModal from "./FileModal";
import ProgressBar from "./ProgressBar";
import { Picker, emojiIndex } from "emoji-mart";
import "emoji-mart/css/emoji-mart.css";

const MessageForm = (props) => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [modal, setModal] = useState(false);
  const [uploadState, setUploadState] = useState("");
  const [uploadTask, setUploadTask] = useState(null);
  const [percentUploaded, setPercentUploaded] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [typing, setTyping] = useState(false);
  const [emojiPicker, setEmojiPicker] = useState(false);
  const inputFocus = useRef(null);

  const storageRef = firebase.storage().ref();

  const channel = props.currentChannel;
  const user = props.currentUser;
  const { isProgressBarVisible, isPrivateChannel, getMessagesRef } = props;

  const handleChange = (event) => {
    setMessage(event.target.value);
  };

  const createMessage = useCallback(
    (fileUrl = null) => {
      const messageData = {
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        user: {
          id: user.uid,
          name: user.displayName,
          avatar: user.photoURL,
        },
      };
      if (fileUrl !== null) {
        messageData["image"] = fileUrl;
      } else {
        messageData["content"] = message;
      }
      return messageData;
    },
    [message, user.displayName, user.photoURL, user.uid]
  );

  const sendFileMessage = useCallback(
    (fileUrl, ref, pathToUpload) => {
      ref
        .child(pathToUpload)
        .push()
        .set(createMessage(fileUrl))
        .then(() => {
          setUploadState("done");
        })
        .catch((err) => {
          console.log(err);
          console.log("func error");

          setErrors([err]);
        });
    },
    [createMessage]
  );

  const sendMessage = () => {
    const { getMessagesRef } = props;
    if (message) {
      setLoading(true);
      getMessagesRef()
        .child(channel.id)
        .push()
        .set(createMessage())
        .then(() => {
          setLoading(false);
          setMessage("");
          setErrors([]);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
          setErrors([err]);
        });
    } else {
      setErrors([{ message: "Add a message" }]);
    }
  };

  const openModal = () => {
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
  };

  const getPath = () => {
    if (isPrivateChannel) {
      return `chat/private-${channel.id}`;
    } else {
      return "chat/public";
    }
  };

  const uploadFile = (file, metadata) => {
    const filePath = `${getPath()}/${uuidv4()}.jpg`;
    setUploadState("uploading");
    setUploadTask(storageRef.child(filePath).put(file, metadata));
  };

  useEffect(() => {
    if (uploadTask && uploadState !== "done") {
      uploadTask.on(
        "state_changed",
        (snap) => {
          setPercentUploaded(
            Math.floor((snap.bytesTransferred / snap.totalBytes) * 100)
          );
          isProgressBarVisible(uploadState);
        },
        (err) => {
          console.log(err);
          setUploadError(err);
          setUploadState("error");
          setUploadTask(null);
          console.log(uploadError);
        },
        () => setUploadState("done")
      );
    }
  });

  useEffect(() => {
    const ref = getMessagesRef();
    if (uploadState === "done" && uploadTask) {
      setPercentUploaded(0);
      isProgressBarVisible(uploadState);
      uploadTask.snapshot.ref
        .getDownloadURL()
        .then((downloadUrl) => {
          sendFileMessage(downloadUrl, ref, channel.id);
        })
        .catch((err) => {
          console.log(err);

          setUploadError(err);
          setUploadState("error");
          setUploadTask(null);
        });
      setUploadTask(null);
    }
  }, [
    uploadState,
    channel,
    uploadTask,
    getMessagesRef,
    isProgressBarVisible,
    sendFileMessage,
  ]);

  useEffect(() => {
    if (message.length >= 1) {
      setTyping(true);
    } else if (message.length === 0) {
      setTyping(false);
    }
  }, [message]);

  const handleKeyDown = (event) => {
    if (event.keyCode === 13) {
      sendMessage();
    }
  };

  useEffect(() => {
    const typingRef = firebase.database().ref("typing");

    if (typing && channel && user) {
      typingRef.child(channel.id).child(user.uid).set(user.displayName);
      return () => {
        typingRef.child(channel.id).child(user.uid).remove();
      };
    } else if (!typing && channel && user) {
      typingRef.child(channel.id).child(user.uid).remove();
      return () => {
        typingRef.child(channel.id).child(user.uid).remove();
      };
    }
  }, [typing, channel, user]);

  const handleTogglePicker = () => {
    setEmojiPicker(!emojiPicker);
  };

  const handleAddEmoji = (emoji) => {
    const oldMessage = message;
    const newMessage = colonToUnicode(` ${oldMessage} ${emoji.colons} `);
    setMessage(newMessage);
    setEmojiPicker(false);
    setTimeout(() => inputFocus.current.focus(), 0);
  };

  const colonToUnicode = (message) => {
    return message.replace(/:[A-Za-z0-9_+-]+:/g, (x) => {
      x = x.replace(/:/g, "");
      let emoji = emojiIndex.emojis[x];
      if (typeof emoji !== "undefined") {
        let unicode = emoji.native;
        if (typeof unicode !== "undefined") {
          return unicode;
        }
      }
      x = ":" + x + ":";
      return x;
    });
  };

  return (
    <Segment className="message__form">
      {emojiPicker && (
        <Picker
          set="apple"
          className="emojipicker"
          title="Pick your emoji"
          emoji="point_up"
          onSelect={handleAddEmoji}
        />
      )}
      <Input
        fluid
        onKeyDown={handleKeyDown}
        name="message"
        value={message}
        ref={inputFocus}
        style={{ marginButtom: "0.7em" }}
        label={
          <Button
            icon={emojiPicker ? "close" : "add"}
            onClick={handleTogglePicker}
          />
        }
        labelPosition="left"
        onChange={handleChange}
        placeholder="Write your message"
        className={
          errors.some((error) => error.message.includes("message"))
            ? "error"
            : ""
        }
      />
      <Button.Group icon widths="2">
        <Button
          onClick={sendMessage}
          disabled={loading}
          color="orange"
          content="Add reply"
          labelPosition="left"
          icon="edit"
        />
        <Button
          color="teal"
          onClick={openModal}
          disabled={uploadState === "uploading"}
          content="Upload Media"
          labelPosition="right"
          icon="cloud upload"
        />
      </Button.Group>
      <FileModal
        uploadFile={uploadFile}
        modal={modal}
        closeModal={closeModal}
      />
      <ProgressBar
        uploadState={uploadState}
        percentUploaded={percentUploaded}
      />
    </Segment>
  );
};

export default MessageForm;
