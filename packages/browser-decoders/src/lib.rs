//! Decoders for the codecs no browser decodes, compiled to WebAssembly for the browser's own
//! player. Each is driven through plain exported functions over the module's memory, so the page
//! needs nothing but `WebAssembly.instantiate` to use them.

#![allow(
    unsafe_code,
    reason = "the page drives the decoders through exported functions over raw pointers into the module's memory, which needs no_mangle and unsafe blocks"
)]

pub mod memory;
pub mod mpeg2_session;
pub mod truehd_session;
