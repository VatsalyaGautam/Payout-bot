import { expect, test, describe } from 'bun:test';
import { loadState, saveState } from '@/store/store';

describe('Store & State Management', () => {
    test('saveState and loadState work with DB integration', async () => {
        const newState = {
            acknowledged: {
                'bill_2026-03-27': '2026-03-27',
            },
            lastAlerted: {},
            messageMap: {
                'msg-1': 'bill_2026-03-27',
            },
        };

        await saveState(newState);
        const loaded = await loadState();

        expect(loaded.acknowledged['bill_2026-03-27']).toBe('2026-03-27');
        expect(loaded.messageMap['msg-1']).toBe('bill_2026-03-27');
    });
});
