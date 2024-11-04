
import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { agentsDropdown, WebhookActionConfig, TriggerType, volubileCommon } from '../common';
import { nanoid } from 'nanoid';
import { volubileAuth } from '../auth';
export const postCallTrigger = createTrigger({
  name: 'postCallTrigger',
  displayName: 'Post Call Trigger',
  description: 'Post call trigger',
  props: {
    agentId: agentsDropdown,
    sampleData: Property.Json({
      displayName: 'Sample data',
      description:
        'Set the test input data',
      defaultValue: {},
      required: false,
    }),
  },
  auth: volubileAuth,
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async test(context) {
    const data = context.propsValue.sampleData;
    return [data];
  },
  async onEnable(context) {
    const webhookId = await volubileCommon.subscribeWebhook(
      context.auth,
      context.propsValue.agentId!,
      {
        url: context.webhookUrl,
        agentId: context.propsValue.agentId!,
        name: context.webhookUrl.split('/').pop(),
        trigger: TriggerType.POST_CALL,
      } as WebhookActionConfig,
    );
    await context.store.put(`_new_post_trigger`, webhookId);
  },
  async onDisable(context){
    const webhookId = await context.store.get<string>(
      `_new_post_trigger`
    );
    if (webhookId)
      await volubileCommon.unsubscribeWebhook(context.auth, webhookId)
  },
  async run(context){
    return [context.payload.body]
  }
})
