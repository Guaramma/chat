import React, { useState, useEffect } from "react";
import {
  Menu,
  Icon,
  Modal,
  Form,
  Input,
  Button,
  Label,
} from "semantic-ui-react";
import firebase from "../../firebase";
import { connect } from "react-redux";
import { setCurrentChannel, setPrivateChannel } from "../../actions";

const Channels = (props) => {
  const [channels, setChannels] = useState([]);
  const [modal, setModal] = useState(false);
  const [channalData, setChannalData] = useState({
    channelName: "",
    channelDetails: "",
  });
  const [activeChannel, setActiveChannel] = useState("");
  const [channel, setChannel] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const channelsRef = firebase.database().ref("channels");
  const user = props.currentUser;

  const changeChannel = (channel) => {
    setActiveChannel(channel);
    clearNotifications();
    props.setCurrentChannel(channel);
    props.setPrivateChannel(false);
    setChannel(channel);
  };

  const clearNotifications = () => {
    let index = notifications.findIndex(
      (notification) => notification.id === channel.id
    );

    if (index !== -1) {
      let updatedNotifications = [...notifications];
      updatedNotifications[index].total = notifications[index].lastKnownTotal;
      updatedNotifications[index].count = 0;
      setNotifications(updatedNotifications);
    }
  };

  useEffect(() => {
    const channelsRef = firebase.database().ref("channels");

    const addListeners = () => {
      channelsRef.on("value", (snap) => {
        if (snap.val()) {
          let arr = Object.keys(snap.val()).map((key) => snap.val()[key]);
          setChannels(arr);
        }
      });
    };
    addListeners();

    return () => channelsRef.off();
  }, []);

  useEffect(() => {
    const messagesRef = firebase.database().ref("messages");

    const handleNotifications = (
      channelId,
      currentChannelId,
      notifications,
      snap
    ) => {
      let lastTotal = 0;

      let index = notifications.findIndex(
        (notification) => notification.id === channelId
      );

      if (index !== -1) {
        if (channel !== currentChannelId) {
          lastTotal = notifications[index].total;

          if (snap.numChildren() - lastTotal > 0) {
            notifications[index].count = snap.numChildren() - lastTotal;
          }
        }
        notifications[index].lastKnownTotal = snap.numChildren();
      } else {
        notifications.push({
          id: channelId,
          total: snap.numChildren(),
          lastKnownTotal: snap.numChildren(),
          count: 0,
        });
      }

      setNotifications(notifications);
    };

    const addNotificationListener = (channelId) => {
      const getMessages = (snap) => {
        if (channel) {
          handleNotifications(channelId, channel.id, notifications, snap);
        }
      };

      const myListener = () => {
        messagesRef.child(channelId).on("value", getMessages);
      };
      myListener();
    };

    channels.forEach((channel) => addNotificationListener(channel.id));

    return () => {
      messagesRef.off();
    };
  }, [channel, channels, notifications]);

  useEffect(() => {
    const firstChannel = () => {
      const firstChannel = channels[0];

      if (channels.length > 0) {
        setActiveChannel(firstChannel);
        props.setCurrentChannel(firstChannel);
        setChannel(firstChannel);
      }
    };

    firstChannel();
  }, [channels, setActiveChannel, props]);

  const getNotificationCount = (channel) => {
    let count = 0;
    notifications.forEach((notification) => {
      if (notification.id === channel.id) {
        count = notification.count;
      }
    });

    if (count > 0) return count;
  };

  const displayChannels = (channels) =>
    channels.length > 0 &&
    channels.map((channel) => (
      <Menu.Item
        key={channel.id}
        onClick={() => changeChannel(channel)}
        name={channel.name}
        style={{ opacity: 0.7 }}
        active={channel.id === activeChannel.id}
      >
        {getNotificationCount(channel) && (
          <Label color="red">{getNotificationCount(channel)}</Label>
        )}
        # {channel.name}
      </Menu.Item>
    ));

  const openModal = () => setModal(true);

  const closeModal = () => setModal(false);

  const handleChange = (event) =>
    setChannalData({
      ...channalData,
      [event.target.name]: event.target.value,
    });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isFormvalid(channalData)) {
      addChannel();
    }
  };

  const addChannel = () => {
    const key = channelsRef.push().key;

    const newChannel = {
      id: key,
      name: channalData.channelName,
      details: channalData.channelDetails,
      createdBy: {
        name: user.displayName,
        avatar: user.photoURL,
      },
    };

    channelsRef
      .child(key)
      .update(newChannel)
      .then(() => {
        setChannalData({ channelDetails: "", channelName: "" });
        closeModal();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const isFormvalid = ({ channelName, channelDetails }) =>
    channelName && channelDetails;

  return (
    <>
      <Menu.Menu className="menu">
        <Menu.Item>
          <span>
            <Icon name="exchange" /> CHANNELS
          </span>{" "}
          ({channels.length}){" "}
          <Icon name="add" onClick={openModal} style={{ cursor: "pointer" }} />
        </Menu.Item>
        {displayChannels(channels)}
      </Menu.Menu>

      {/* Add Channel Modal */}

      <Modal basic open={modal} onClose={closeModal}>
        <Modal.Header>Add a Channel</Modal.Header>
        <Modal.Content>
          <Form onSubmit={handleSubmit}>
            <Form.Field>
              <Input
                fluid
                label="Name of Channel"
                name="channelName"
                onChange={handleChange}
              />
            </Form.Field>

            <Form.Field>
              <Input
                fluid
                label="About the Channel"
                name="channelDetails"
                onChange={handleChange}
              />
            </Form.Field>
          </Form>
        </Modal.Content>

        <Modal.Actions>
          <Button color="green" inverted onClick={handleSubmit}>
            <Icon name="checkmark" /> Add
          </Button>

          <Button color="red" inverted onClick={closeModal}>
            <Icon name="remove" /> Cancel
          </Button>
        </Modal.Actions>
      </Modal>
    </>
  );
};

export default connect(null, { setCurrentChannel, setPrivateChannel })(
  Channels
);
