import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  agentsDropdown,
  PreWebhookActionConfig,
  TriggerType,
  volubileCommon,
} from '../common';
import { volubileAuth } from '../auth';

const markdown = `
If you wish to return a context for the triggered call, ensure the last step in the flow is **Return Context**.
`;

export const preCallTrigger = createTrigger({
  name: 'preCallTrigger',
  displayName: 'Pre Call Trigger',
  description: 'Pre call trigger',
  props: {
    agentId: agentsDropdown,
    about: Property.MarkDown({
      value: markdown,
    }),
    sampleData: Property.Json({
      displayName: 'Sample data',
      description: 'Set the test input data',
      defaultValue: {},
      required: false,
    }),
  },
  auth: volubileAuth,
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async test(context) {
    const data = context.propsValue.sampleData;
    if (data === null || data === undefined || Object.keys(data!).length === 0) {
      return [
        await volubileCommon.getContext(
          context.auth,
          context.propsValue.agentId!,
          TriggerType.PRE_CALL
        ),
      ];
    }

    return [data];
  },
  async onEnable(context) {
    const webhookId = await volubileCommon.subscribeWebhook(
      context.auth,
      context.propsValue.agentId!,
      {
        url: context.webhookUrl + "/sync",
        agentId: context.propsValue.agentId!,
        name: context.webhookUrl.split('/').pop(),
        trigger: TriggerType.PRE_CALL,
        context: await context.store.get('context'),
      } as PreWebhookActionConfig
    );
    await context.store.put(`_new_pre_trigger`, webhookId);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>(
      `_new_pre_trigger`
    );
    if (webhookId)
      await volubileCommon.unsubscribeWebhook(context.auth, webhookId);
  },
  async run(context) {
    return [context.payload.body];
  },
});
