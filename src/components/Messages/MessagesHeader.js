import React from "react";
import { Header, Segment, Input, Icon } from "semantic-ui-react";

const MessagesHeader = (props) => {
  const {
    channelName,
    numUniqueUsers,
    handleSearchChange,
    searchLoading,
    isPrivateChannel,
    handleStar,
    isChannelStar,
  } = props;

  return (
    <Segment clearing>
      {/* Channel Title */}
      <Header fluid="true" as="h2" floated="left" style={{ marginBottom: 0 }}>
        <span>
          {channelName}
          {!isPrivateChannel && (
            <Icon
              onClick={handleStar}
              name={isChannelStar ? "star" : "star outline"}
              color={isChannelStar ? "yellow" : "black"}
              style={{ cursor: "pointer" }}
            />
          )}
        </span>
        <Header.Subheader>{numUniqueUsers}</Header.Subheader>
      </Header>

      {/* Channel Search Input */}
      <Header floated="right">
        <Input
          loading={searchLoading}
          onChange={handleSearchChange}
          size="mini"
          icon="search"
          name="searchTerm"
          placeholder="SearchMessages"
        />
      </Header>
    </Segment>
  );
};

export default MessagesHeader;
