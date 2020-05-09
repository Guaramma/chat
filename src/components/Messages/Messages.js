import React, { useState, useEffect, createRef } from "react";
import { Segment, Comment } from "semantic-ui-react";
import MessagesHeader from "./MessagesHeader";
import MessageForm from "./MessageForm";
import firebase from "../../firebase";
import Message from "./Message";
import { connect } from "react-redux";
import { setUserPosts } from "../../actions";
import Typing from "./Typing";

const Messages = (props) => {
  const [messages, setMessages] = useState([]);
  const [progressBar, setProgressBar] = useState(false);
  const [numUniqueUsers, setNumUniqueUsers] = useState("");
  const [messageSearch, setMessageSearch] = useState({
    searchTerm: "",
  });
  const [messageSearchLoading, setMessageSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isChannelStar, setChannelStar] = useState(false);
  const [starLoading, setStarLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const scroll = createRef(null);

  const messagesRef = firebase.database().ref("messages");
  const privateMessagesRef = firebase.database().ref("privateMessages");
  const channel = props.currentChannel;
  const user = props.currentUser;
  const privateChannel = props.isPrivateChannel;
  const setUserPosts = props.setUserPosts;

  const handleStar = () => {
    setChannelStar(!isChannelStar);
  };

  useEffect(() => {
    scroll.current.scrollIntoView();
  }, [scroll, messages]);

  useEffect(() => {
    const typingRef = firebase.database().ref("typing");
    if (channel) {
      const typingListeners = (channelId) => {
        typingRef.child(channelId).on("child_added", (snap) => {
          if (snap.key !== user.uid) {
            setTypingUsers((prev) =>
              prev.concat({
                id: snap.key,
                name: snap.val(),
              })
            );
          }
        });
        typingRef.child(channelId).on("child_removed", (snap) => {
          setTypingUsers((prev) => {
            let index = prev.findIndex((user) => user.id !== snap.key);

            if (index >= 0) {
              let arr = prev.filter(
                (userTypeing) => userTypeing.id !== snap.key
              );

              return arr;
            } else {
              return [];
            }
          });
        });
      };

      typingListeners(channel.id);

      return () => typingRef.off();
    }
  }, [channel, user]);

  useEffect(() => {
    const usersRef = firebase.database().ref("users");
    const starChannel = () => {
      if (channel && user && !starLoading) {
        if (isChannelStar) {
          usersRef.child(`${user.uid}/starred`).update({
            [channel.id]: { ...channel },
          });
        } else {
          usersRef
            .child(`${user.uid}/starred`)
            .child(channel.id)
            .remove((err) => {
              if (err !== null) {
                console.log(err);
              }
            });
        }
      }
    };

    starChannel();
  }, [isChannelStar, channel, user, starLoading]);

  useEffect(() => {
    const usersRef = firebase.database().ref("users");

    const addUserStarListener = (channelId, userId) => {
      usersRef
        .child(userId)
        .child("starred")
        .once("value")
        .then((data) => {
          if (data.val() !== null) {
            const channelIds = Object.keys(data.val());
            const prevStarred = channelIds.includes(channelId);
            setChannelStar(prevStarred);
          }
          setStarLoading(false);
        });
    };

    if (channel && user) {
      addUserStarListener(channel.id, user.uid);
    }
  }, [channel, user]);

  useEffect(() => {
    const messagesRef = firebase.database().ref("messages");
    const privateMessagesRef = firebase.database().ref("privateMessages");
    const privateChannel = props.isPrivateChannel;

    const getMessagesRef = () => {
      return privateChannel ? privateMessagesRef : messagesRef;
    };

    const ref = getMessagesRef();
    const handleMessages = (snap) => {
      if (snap.val()) {
        let arr = Object.keys(snap.val()).map((key) => snap.val()[key]);
        setMessages(arr);
      }
    };

    if (channel && user) {
      ref.child(channel.id).on("value", handleMessages);

      return () => {
        ref.child(channel.id).off();
      };
    }
  }, [channel, user, props]);

  const getMessagesRef = () => {
    return privateChannel ? privateMessagesRef : messagesRef;
  };

  useEffect(() => {
    const countUniqueUsers = (messages) => {
      const uniqueUsers = messages.reduce((acc, message) => {
        if (!acc.includes(message.user.name)) {
          acc.push(message.user.name);
        }
        return acc;
      }, []);

      const plural = uniqueUsers.length > 1 || uniqueUsers.length === 0;

      const numUniqueUsers = `${uniqueUsers.length} user${plural ? "s" : ""}`;
      setNumUniqueUsers(numUniqueUsers);
    };
    if (!privateChannel) {
      countUniqueUsers(messages);
    }
  }, [messages, privateChannel]);

  useEffect(() => {
    const countUserPosts = (messages) => {
      let userPosts = messages.reduce((acc, message) => {
        if (message.user.name in acc) {
          acc[message.user.name].count += 1;
        } else {
          acc[message.user.name] = {
            avatar: message.user.avatar,
            count: 1,
          };
        }
        return acc;
      }, {});
      setUserPosts(userPosts);
    };
    countUserPosts(messages);
  }, [messages, setUserPosts]);

  const handleSearchChange = (event) => {
    setMessageSearch({
      searchTerm: event.target.value,
    });
    setMessageSearchLoading(true);
  };

  useEffect(() => {
    const handleSearchMessages = () => {
      const channelMessages = [...messages];
      const regex = new RegExp(messageSearch.searchTerm, "gi");
      const searchingResults = channelMessages.reduce((acc, message) => {
        if (
          (message.content && message.content.match(regex)) ||
          message.user.name.match(regex)
        ) {
          acc.push(message);
        }
        return acc;
      }, []);
      setSearchResults(searchingResults);
    };
    handleSearchMessages();
    if (messageSearch.searchTerm.length > 0) {
      setTimeout(() => setMessageSearchLoading(false), 1000);
    } else if (messageSearch.searchTerm.length === 0) {
      setMessageSearchLoading(false);
    }
  }, [messageSearch, messages]);

  useEffect(() => {
    const connectedRef = firebase.database().ref("info/connected");
    const typingRef = firebase.database().ref("typing");
    connectedRef.on("value", (snap) => {
      if (snap.val() === true) {
        typingRef
          .child(channel.id)
          .child(user.uid)
          .onDisconnect()
          .remove((err) => {
            if (err !== null) {
              console.log(err);
            }
          });
      }
    });

    return () => connectedRef.off();
  }, [channel, user]);

  const displayMessages = (messages) => {
    return (
      messages.length > 0 &&
      messages.map((message) => {
        return (
          <Message key={message.timestamp} message={message} user={user} />
        );
      })
    );
  };

  const isProgressBarVisible = (percent) => {
    if (percent === "uploading") {
      setProgressBar(true);
    } else {
      setProgressBar(false);
    }
  };

  const displayChannelName = (channel) => {
    return channel ? `${privateChannel ? "@" : "#"}${channel.name}` : "";
  };

  const displayTypingUsers = (users) =>
    users.length > 0 &&
    users.map((user) => (
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "0.2em" }}
        key={user.id}
      >
        <span className="user__typing">{user.name} is typing</span> <Typing />
      </div>
    ));

  return (
    <>
      <MessagesHeader
        channelName={displayChannelName(channel)}
        numUniqueUsers={numUniqueUsers}
        handleSearchChange={handleSearchChange}
        searchLoading={messageSearchLoading}
        isPrivateChannel={privateChannel}
        handleStar={handleStar}
        isChannelStar={isChannelStar}
      />
      <Segment>
        <Comment.Group
          className={progressBar ? "messages__progress" : "messages"}
        >
          {messageSearch.searchTerm
            ? displayMessages(searchResults)
            : displayMessages(messages)}

          {displayTypingUsers(typingUsers)}
          <div ref={scroll} />
        </Comment.Group>
      </Segment>

      <MessageForm
        currentChannel={channel}
        messagesRef={messagesRef}
        currentUser={user}
        isProgressBarVisible={isProgressBarVisible}
        isPrivateChannel={privateChannel}
        getMessagesRef={getMessagesRef}
      />
    </>
  );
};

export default connect(null, { setUserPosts })(Messages);
