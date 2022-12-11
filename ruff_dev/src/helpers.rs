use std::fs;
use std::fs::File;
use std::io::Write;
use std::path::Path;

use anyhow::Result;

pub fn update_file<P>(path: P, updater: impl Fn(String) -> String) -> Result<()>
where
    P: AsRef<Path>,
{
    let existing = fs::read_to_string(&path)?;
    let output = updater(existing);
    let mut f = File::options().write(true).truncate(true).open(&path)?;
    write!(f, "{output}")?;

    Ok(())
}
