import { StoresService } from './stores.service';
import { RealtimeBusService } from '../../shared/services/realtime-bus.service';
import { PhoneService } from '../phone/phone.service';

describe('StoresService', () => {
    let service: StoresService;

    beforeEach(() => {
        const bus = new RealtimeBusService();
        const phone = new PhoneService(bus);
        service = new StoresService(bus, phone);
    });

    it('lists all London-inspired Pandora stores and finds catalog items by SKU', () => {
        const stores = service.listStores();
        expect(stores.length).toBeGreaterThanOrEqual(4);

        const harrods = service.getStore('harrods-emporium');
        expect(harrods.name).toContain('Harrods');

        const found = service.findCatalogItem('royal-top-hat');
        expect(found).not.toBeNull();
        expect(found?.item.grantsHatStyle).toBe('tophat');
    });
});

