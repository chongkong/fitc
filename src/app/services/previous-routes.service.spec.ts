import { TestBed } from '@angular/core/testing';

import { PreviousRoutesService } from './previous-routes.service';

describe('PreviousRoutesService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PreviousRoutesService = TestBed.get(PreviousRoutesService);
    expect(service).toBeTruthy();
  });
});
