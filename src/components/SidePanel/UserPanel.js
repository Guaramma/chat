import React, { useState, useEffect } from "react";
import firebase from "../../firebase";
import {
  Grid,
  Header,
  Icon,
  Dropdown,
  Image,
  Modal,
  Input,
  Button,
} from "semantic-ui-react";
import AvatarEditor from "react-avatar-editor";

const UserPanel = (props) => {
  const [modal, setModal] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [cropFile, setCropFile] = useState({});
  const [crop, setCrop] = useState(null);
  const [uploadedCroppedImage, setUploadedCroppedImage] = useState(null);

  const metaData = {
    contentType: "image/jpeg",
  };

  const user = props.currentUser;
  const primaryColor = props.primaryColor;
  const storageRef = firebase.storage().ref();
  const userRef = firebase.auth().currentUser;
  const usersRef = firebase.database().ref("users");

  const openModal = () => setModal(true);
  const closeModal = () => setModal(false);

  const dropDownOptions = () => [
    {
      key: "user",
      text: (
        <span>
          Signed in as <strong>{user.displayName}</strong>{" "}
        </span>
      ),
      disabled: true,
    },
    {
      key: "avatar",
      text: <span onClick={openModal}>Change Avatar</span>,
    },
    {
      key: "signout",
      text: <span onClick={handleSignOut}>Signed Out</span>,
    },
  ];

  const handleSignOut = () => {
    firebase
      .auth()
      .signOut()
      .then(() => console.log("signed out!"));
  };

  const handleChange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    if (file) {
      reader.readAsDataURL(file);
      reader.addEventListener("load", () => {
        setPreviewImage(reader.result);
      });
    }
  };

  const handleCropImage = () => {
    if (cropFile) {
      cropFile.getImageScaledToCanvas().toBlob((blob) => {
        let imageUrl = URL.createObjectURL(blob);
        setCrop({ croppedImage: imageUrl, blob });
      });
    }
  };

  const uploadCroppedImage = () => {
    storageRef
      .child(`avatars/user-${userRef.uid}`)
      .put(crop.blob, metaData)
      .then((snap) => {
        snap.ref.getDownloadURL().then((downloadURL) => {
          setUploadedCroppedImage(downloadURL);
        });
      });
  };

  useEffect(() => {
    const changeAvatar = () => {
      userRef
        .updateProfile({
          photoURL: uploadedCroppedImage,
        })
        .then(() => {
          console.log("photo Updated");
          closeModal();
        })
        .catch((err) => {
          console.log(err);
        });

      usersRef
        .child(user.uid)
        .update({ avatar: uploadedCroppedImage })
        .then(() => {
          console.log("User avatar updated");
        })
        .catch((err) => {
          console.log(err);
        });
    };
    if (uploadedCroppedImage) {
      changeAvatar();
    }
  }, [uploadedCroppedImage, userRef, user, usersRef]);

  return (
    <Grid style={{ background: primaryColor }}>
      <Grid.Column>
        <Grid.Row style={{ padding: "1.2em", margin: 0 }}>
          {/* App Header */}
          <Header inverted floated="left" as="h2">
            <Icon name="code" />
            <Header.Content>DevChat</Header.Content>
          </Header>

          {/* User Dropdown */}
          <Header style={{ padding: "0.25em" }} as="h4" inverted>
            <Dropdown
              trigger={
                <span>
                  <Image src={user.photoURL} spaced="right" avatar />
                  {user.displayName}
                </span>
              }
              options={dropDownOptions()}
            />
          </Header>
        </Grid.Row>

        {/* Change User Avatar Modal */}
        <Modal basic open={modal} onClose={closeModal}>
          <Modal.Header>Change Avatar</Modal.Header>
          <Modal.Content>
            <Input
              onChange={handleChange}
              fluid
              type="file"
              label="New avatar"
              name="previewImage"
            />
            <Grid centered stackable columns={2}>
              <Grid.Row centered>
                <Grid.Column className="ui center aligned grid">
                  {previewImage && (
                    <AvatarEditor
                      ref={(node) => setCropFile(node)}
                      image={previewImage}
                      width={120}
                      height={120}
                      border={50}
                      scale={1.2}
                    />
                  )}
                </Grid.Column>
                <Grid.Column>
                  {crop && (
                    <Image
                      style={{
                        margin: "3.5em auto",
                      }}
                      width={100}
                      height={100}
                      src={crop.croppedImage}
                    />
                  )}
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Modal.Content>
          <Modal.Actions>
            {crop && (
              <Button color="green" inverted onClick={uploadCroppedImage}>
                <Icon name="save" /> Change Avatar
              </Button>
            )}
            <Button color="green" inverted onClick={handleCropImage}>
              <Icon name="image" /> Preview
            </Button>
            <Button color="red" inverted onClick={closeModal}>
              <Icon name="remove" /> Cancel
            </Button>
          </Modal.Actions>
        </Modal>
      </Grid.Column>
    </Grid>
  );
};

export default UserPanel;
