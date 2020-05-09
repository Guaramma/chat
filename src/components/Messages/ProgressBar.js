import React from "react";
import { Progress } from "semantic-ui-react";

const ProgressBar = (props) => {
  const { uploadState, percentUploaded } = props;
  return (
    uploadState === "uploading" && (
      <Progress
        className="progress__bar"
        percent={percentUploaded}
        progress
        indicating
        size="medium"
        inverted
      />
    )
  );
};

export default ProgressBar;
