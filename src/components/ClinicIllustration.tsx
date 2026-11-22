import React from 'react';
import calendarLight from '../assets/minimal/calendar-light.svg';
import calendarDark from '../assets/minimal/calendar-dark.svg';
import ticketLight from '../assets/minimal/ticket-light.svg';
import ticketDark from '../assets/minimal/ticket-dark.svg';
import doctorLight from '../assets/minimal/doctor-light.svg';
import doctorDark from '../assets/minimal/doctor-dark.svg';
import searchLight from '../assets/minimal/search-light.svg';
import searchDark from '../assets/minimal/search-dark.svg';
const scenes = { calendar: [calendarLight, calendarDark], ticket: [ticketLight, ticketDark], doctor: [doctorLight, doctorDark], search: [searchLight, searchDark] };
/** Original PDF vectors, with the matching supplied variant for each theme. Decorative only. */
export function ClinicIllustration({ kind, className = '', eager = false }: { kind: keyof typeof scenes; className?: string; eager?: boolean }) {
  const [light, dark] = scenes[kind];
  return <span className={`clinic-art ${className}`} aria-hidden="true">
    <img className="clinic-art-light" src={light} alt="" width="1350" height="1125" loading={eager ? 'eager' : 'lazy'} />
    <img className="clinic-art-dark" src={dark} alt="" width="1350" height="1125" loading={eager ? 'eager' : 'lazy'} />
  </span>;
}
