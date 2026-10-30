import { TestBed } from '@angular/core/testing';
import { Pagination } from './pagination';

function render(page: number, last: number): string[] {
  const fixture = TestBed.createComponent(Pagination);
  fixture.componentRef.setInput('page', page);
  fixture.componentRef.setInput('last', last);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return [...el.querySelectorAll('.num, .gap')].map((n) => n.textContent!.trim());
}

describe('Pagination', () => {
  it('shows first, last and neighbours with gaps', () => {
    expect(render(10, 20)).toEqual(['1', '…', '9', '10', '11', '…', '20']);
  });

  it('has no gaps near the start', () => {
    expect(render(2, 20)).toEqual(['1', '2', '3', '…', '20']);
  });

  it('renders nothing for a single page', () => {
    expect(render(1, 1)).toEqual([]);
  });

  it('emits the chosen page', () => {
    const fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('page', 3);
    fixture.componentRef.setInput('last', 5);
    fixture.detectChanges();
    const emitted: number[] = [];
    fixture.componentInstance.pageChange.subscribe((p) => emitted.push(p));
    const next = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[aria-label="Next page"]')!;
    next.click();
    expect(emitted).toEqual([4]);
  });
});
