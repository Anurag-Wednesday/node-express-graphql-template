import slackNotify from 'slack-notify';

let slack;
function getSlackInstance() {
  if (!slack) {
    slack = slackNotify(process.env.SLACK_WEBHOOK_URL);
  }
  return slack;
}
export async function sendMessage(text) {
  if (['production', 'local', 'development'].includes(process.env.ENVIRONMENT_NAME)) {
    getSlackInstance().send({
      text: JSON.stringify(text),
      username: 'node-express-alerts'
    });
  }
}
