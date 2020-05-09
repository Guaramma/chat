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
  const [, setMessagesLoading] = useState(false);

  const channelsRef = firebase.database().ref("channels");
  const user = props.currentUser;

  const changeChannel = (newChannel) => {
    setActiveChannel(newChannel);
    clearNotifications();
    props.setCurrentChannel(newChannel);
    props.setPrivateChannel(false);
    setChannel(newChannel);
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
      messagesList,
      currentChannelId,
      notifications
    ) => {
      let lastTotal = 0;
      let arrChannelsId = Object.keys(messagesList);
      let newNotifications = notifications;
      arrChannelsId.forEach((channelId) => {
        let arrOfId = Object.keys(messagesList[channelId]);
        let messagesCount = arrOfId.length;

        let index = newNotifications.findIndex(
          (notification) => notification.id === channelId
        );

        if (index !== -1) {
          if (channel !== currentChannelId) {
            lastTotal = newNotifications[index].total;

            if (messagesCount - lastTotal > 0) {
              newNotifications[index].count = messagesCount - lastTotal;
            }
          }
          newNotifications[index].lastKnownTotal = messagesCount;
        } else {
          newNotifications.push({
            id: channelId,
            total: messagesCount,
            lastKnownTotal: messagesCount,
            count: 0,
          });
        }
      });
      setNotifications(newNotifications);
    };

    messagesRef.on("value", (snap) => {
      if (snap.val() && channel) {
        setMessagesLoading(true);
        handleNotifications(snap.val(), channel.id, notifications);
        setMessagesLoading(false);
      }
    });

    return () => {
      messagesRef.off();
    };
  }, [channel, notifications]);

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

  const displayChannels = (channels) => {
    return (
      channels.length > 0 &&
      channels.map((channel) => {
        let unseen = notifications.find(
          (myChannel) => myChannel.id === channel.id
        );
        let count;
        if (unseen && channel !== activeChannel) {
          count = unseen.count;
        }

        return (
          <Menu.Item
            key={channel.id}
            onClick={() => changeChannel(channel)}
            name={channel.name}
            style={{ opacity: 0.7 }}
            active={channel.id === activeChannel.id}
          >
            {count > 0 && <Label color="red">{count}</Label>}# {channel.name}
          </Menu.Item>
        );
      })
    );
  };

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
