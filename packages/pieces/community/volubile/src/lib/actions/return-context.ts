import {
  DynamicPropsValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { StopResponse } from '@activepieces/shared';
import { StatusCodes } from 'http-status-codes';

export const returnContext = createAction({
  name: 'return_context',
  displayName: 'Return Context',
  description: 'return call context',
  props: {
    body_type: Property.StaticDropdown({
      displayName: 'Body Type',
      required: false,
      defaultValue: 'json',
      options: {
        disabled: false,
        options: [
          {
            label: 'JSON',
            value: 'json',
          },
          {
            label: 'Raw',
            value: 'raw',
          },
        ],
      },
    }),
    body: Property.DynamicProperties({
      displayName: 'Response',
      refreshers: ['body_type'],
      required: true,
      props: async ({ body_type }) => {
        if (!body_type) return {};

        const bodyTypeInput = body_type as unknown as string;

        const fields: DynamicPropsValue = {};

        switch (bodyTypeInput) {
          case 'json':
            fields['data'] = Property.Json({
              displayName: 'JSON Body',
              required: true,
            });
            break;
          case 'raw':
            fields['data'] = Property.LongText({
              displayName: 'Raw Body',
              required: true,
            });
            break;
        }
        return fields;
      },
    }),
  },

  async test(context) {
    const { body } = context.propsValue;
    const bodyInput = body['data'];
    const data = parseToJson(bodyInput);
    await context.store.put('context', data);
    return data
  },

  async run(context) {
    const { body, body_type } = context.propsValue;
    const bodyInput = body['data'];

    const response: StopResponse = {
      status: StatusCodes.OK,
      headers: {},
    };

    if (body_type == 'json') {
      response.body = parseToJson(bodyInput)
    } else {
      response.body = bodyInput;
    }

    context.run.stop({
      response: response,
    });
    return response;
  },
});

function parseToJson(body: unknown) {
  if (typeof body === 'string') {
    return JSON.parse(body);
  }
  return JSON.parse(JSON.stringify(body));
}
