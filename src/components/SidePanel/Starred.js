import React, { useState, useEffect } from "react";
import { Menu, Icon } from "semantic-ui-react";
import { connect } from "react-redux";
import { setCurrentChannel, setPrivateChannel } from "../../actions/index";
import firebase from "../../firebase";

const Starred = (props) => {
  const [starredChannels, setStarredChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState("");

  useEffect(() => {
    const user = props.currentUser;
    const usersRef = firebase.database().ref("users");

    const addListeners = (userId) => {
      usersRef
        .child(userId)
        .child("starred")
        .on("child_added", (snap) => {
          const starredChannel = { id: snap.key, ...snap.val() };
          setStarredChannels((prev) => [...prev, starredChannel]);
        });

      usersRef
        .child(userId)
        .child("starred")
        .on("child_removed", (snap) => {
          const channelToRemove = { id: snap.key, ...snap.val() };
          setStarredChannels((prev) => {
            return prev.filter((channel) => {
              return channel.id !== channelToRemove.id;
            });
          });
        });
    };
    if (user) {
      addListeners(user.uid);
    }
    return () => usersRef.child(user.uid).child("starred").off();
  }, [props]);

  const changeChannel = (channel) => {
    setActiveChannel(channel);
    props.setCurrentChannel(channel);
    props.setPrivateChannel(false);
  };

  const displayChannels = (starredChannels) => {
    return (
      starredChannels.length > 0 &&
      starredChannels.map((channel) => {
        return (
          <Menu.Item
            key={channel.id}
            onClick={() => changeChannel(channel)}
            name={channel.name}
            style={{ opacity: 0.7 }}
            active={channel.id === activeChannel.id}
          >
            # {channel.name}
          </Menu.Item>
        );
      })
    );
  };

  return (
    <Menu.Menu className="menu">
      <Menu.Item>
        <span>
          <Icon name="star" /> STARRED
        </span>{" "}
        ({starredChannels ? starredChannels.length : 0})
      </Menu.Item>
      {displayChannels(starredChannels)}
    </Menu.Menu>
  );
};

export default connect(null, { setCurrentChannel, setPrivateChannel })(Starred);
