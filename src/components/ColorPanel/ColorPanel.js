import React, { useState, useEffect } from "react";
import {
  Sidebar,
  Menu,
  Divider,
  Button,
  Modal,
  Icon,
  Label,
  Segment,
} from "semantic-ui-react";
import { SliderPicker } from "react-color";
import firebase from "../../firebase";
import { connect } from "react-redux";
import { setColors } from "../../actions";

const ColorPanel = (props) => {
  const [modal, setModal] = useState(false);
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");
  const [userColors, setUserColors] = useState([]);

  const user = props.currentUser;
  const usersRef = firebase.database().ref("users");

  const handleChangePrimary = (color) => setPrimary(color.hex);
  const handleChangeSecondary = (color) => setSecondary(color.hex);

  const handleSaveColors = () => {
    if (primary && secondary) {
      saveColors(primary, secondary);
    }
  };

  useEffect(() => {
    const usersRef = firebase.database().ref("users");
    if (user) {
      const addListener = (userUid) => {
        usersRef.child(`${userUid}/colors`).on("child_added", (snap) => {
          let userColors = [];
          userColors.unshift(snap.val());

          setUserColors((prev) => [...prev, userColors]);
        });
      };
      addListener(user.uid);
    }
    return () => usersRef.off();
  }, [user]);

  const saveColors = (primary, secondary) => {
    usersRef
      .child(`${user.uid}/colors`)
      .push()
      .update({
        primary,
        secondary,
      })
      .then(() => {
        console.log("Colors added");
      })
      .catch((err) => console.log(err));
  };

  const openModal = () => setModal(true);

  const closeModal = () => setModal(false);

  const displayUserColors = (colors) =>
    colors.length > 0 &&
    colors.map((color, i) => (
      <React.Fragment key={i}>
        <Divider />
        <div
          className="color__container"
          onClick={() => props.setColors(color[0].primary, color[0].secondary)}
        >
          <div
            className="color__square"
            style={{ background: color[0].primary }}
          >
            <div
              className="color__overlay"
              style={{ background: color[0].secondary }}
            ></div>
          </div>
        </div>
      </React.Fragment>
    ));

  return (
    <Sidebar
      as={Menu}
      icon="labeled"
      inverted
      vertical
      visible
      width="very thin"
    >
      <Divider />
      <Button icon="add" size="small" color="blue" onClick={openModal} />
      {displayUserColors(userColors)}
      {/* Color Picker Modal */}
      <Modal basic open={modal} onClose={closeModal}>
        <Modal.Header>Choose App Color</Modal.Header>
        <Modal.Content>
          <Segment inverted>
            <Label content="Primary Color" />
            <SliderPicker color={primary} onChange={handleChangePrimary} />
          </Segment>

          <Segment inverted>
            <Label content="Secondary Color" />
            <SliderPicker color={secondary} onChange={handleChangeSecondary} />
          </Segment>
        </Modal.Content>

        <Modal.Actions>
          <Button color="green" inverted onClick={handleSaveColors}>
            <Icon name="checkmark" /> Save Colors
          </Button>

          <Button color="red" inverted onClick={closeModal}>
            <Icon name="remove" /> Cancel
          </Button>
        </Modal.Actions>
      </Modal>
    </Sidebar>
  );
};

export default connect(null, { setColors })(ColorPanel);
