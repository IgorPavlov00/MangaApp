import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicAnimePagesComponent } from './basic-anime-pages.component';

describe('BasicAnimePagesComponent', () => {
  let component: BasicAnimePagesComponent;
  let fixture: ComponentFixture<BasicAnimePagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BasicAnimePagesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BasicAnimePagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
