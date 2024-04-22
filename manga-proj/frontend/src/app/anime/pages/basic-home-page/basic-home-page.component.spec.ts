import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicHomePageComponent } from './basic-home-page.component';

describe('BasicHomePageComponent', () => {
  let component: BasicHomePageComponent;
  let fixture: ComponentFixture<BasicHomePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BasicHomePageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BasicHomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
