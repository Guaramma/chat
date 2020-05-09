import React, { useState, useEffect } from "react";
import firebase from "../../firebase";
import { Menu, Icon } from "semantic-ui-react";
import { setCurrentChannel, setPrivateChannel } from "../../actions/index";
import { connect } from "react-redux";

const DirectMessages = (props) => {
  const [users, setUsers] = useState([]);
  const [usersStatus, setUsersStatus] = useState([]);
  const [activeChannel, setActiveChannel] = useState("");

  const user = props.currentUser;
  const { setCurrentChannel, setPrivateChannel } = props;

  useEffect(() => {
    const usersRef = firebase.database().ref("users");

    if (user) {
      usersRef.on("value", (snap) => {
        let loadedUsers = [];
        Object.keys(snap.val()).forEach((key) => {
          if (user.uid !== key) {
            const user = snap.val()[key];
            user["uid"] = key;
            user["status"] = "offline";
            loadedUsers.push(user);
          }
        });

        setUsers(loadedUsers);
      });
    }
    return () => usersRef.off();
  }, [user]);

  useEffect(() => {
    const connectedRef = firebase.database().ref(".info/connected");
    const presenceRef = firebase.database().ref("presence");

    if (user) {
      connectedRef.on("value", (snap) => {
        if (snap.val() === true) {
          const ref = presenceRef.child(user.uid);
          ref.set(true);
        }
      });
    }
    return () => presenceRef.off();
  }, [user]);

  useEffect(() => {
    const presenceRef = firebase.database().ref("presence");

    const addStatusToUser = (userId, connected = true) => {
      const updatedUsers = users.reduce((acc, user) => {
        if (user.uid === userId) {
          user["status"] = `${connected ? "online" : "offline"}`;
        }
        return acc.concat(user);
      }, []);
      setUsersStatus(updatedUsers);
    };

    if (user) {
      presenceRef.on("child_added", (snap) => {
        if (user.uid !== snap.key) {
          addStatusToUser(snap.key);
        }
      });

      presenceRef.on("child_removed", (snap) => {
        if (user.uid !== snap.key) {
          addStatusToUser(snap.key, false);
        }
      });
    }
    return () => presenceRef.off();
  }, [user, users]);

  const isUserOnline = (user) => user.status === "online";

  const changeChannel = (user) => {
    const channelId = getChannelId(user.uid);
    const channelData = {
      id: channelId,
      name: user.name,
    };
    setCurrentChannel(channelData);
    setPrivateChannel(true);
    setActiveChannel(user.uid);
  };

  const getChannelId = (userId) => {
    const currentUserId = user.uid;
    return userId < currentUserId
      ? `${userId}/${currentUserId}`
      : `${currentUserId}/${userId}`;
  };

  const displayStatus = (user) => (
    <Menu.Item
      key={user.uid}
      active={user.uid === activeChannel}
      onClick={() => changeChannel(user)}
      style={{ opacity: 0.7, fontStyle: "italic" }}
    >
      <Icon name="circle" color={isUserOnline(user) ? "green" : "red"} />@{" "}
      {user.name}
    </Menu.Item>
  );

  return (
    <Menu.Menu className="menu">
      <Menu.Item>
        <span>
          <Icon name="mail" /> DIRECT MESSAGES
        </span>{" "}
        ({users.length})
      </Menu.Item>
      {usersStatus.length > 0
        ? usersStatus.map(displayStatus)
        : users.map(displayStatus)}
    </Menu.Menu>
  );
};

export default connect(null, { setCurrentChannel, setPrivateChannel })(
  DirectMessages
);
