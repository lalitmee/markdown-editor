import React from "react";
import ReactDOM from "react-dom";
import MarkdownEditor from "./MarkdownEditor";
import registerServiceWorker from "./registerServiceWorker";
import "semantic-ui-css/semantic.min.css";

ReactDOM.render(<MarkdownEditor />, document.getElementById("root"));
registerServiceWorker();
