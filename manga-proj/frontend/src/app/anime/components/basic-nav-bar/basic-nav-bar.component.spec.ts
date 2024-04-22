import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicNavBarComponent } from './basic-nav-bar.component';

describe('BasicNavBarComponent', () => {
  let component: BasicNavBarComponent;
  let fixture: ComponentFixture<BasicNavBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BasicNavBarComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BasicNavBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
