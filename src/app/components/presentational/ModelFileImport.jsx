import React, { Component, PropTypes } from 'react';

import { Button, Form, FormGroup, FormFeedback, Label, Input, Progress } from 'reactstrap';


class ModelFileImport extends Component {

    chooseFile = () => {
        if (this.fileInput)
            this.fileInput.click()
    }

    selectedFile = (e) => {
        const {createFileImport, clearFileImport} = this.props;

        if (e && e.target.files && e.target.files.length) {
            const file = e.target.files[0].name;
            const name = file.substring(0, file.length - 4);

            createFileImport({
                name: name,
                valid: this.isNameValid(name)
            });
        } else {
            if (this.fileForm)
                this.fileForm.reset();

            clearFileImport();
        }
    }

    changeName = (e) => {
        const {createFileImport} = this.props;

        if (e && e.target) {
            const name = e.target.value;

            createFileImport({
                name: name,
                valid: this.isNameValid(name)
            });
        }
    }

    // TODO: to reducer
    isNameValid = (name) => {
        if (!name || name.length === 0)
            return false

        const taken = this.props.models.findIndex((m) => m.name === name);

        return taken === -1
    }

    uploadFile = () => {
        const {startFileImport, importStats} = this.props;

        if (importStats.name && importStats.valid) {
            startFileImport({
                file: this.fileInput.files[0],
                metadata: {
                    name: importStats.name,
                    size: this.fileInput.files[0].size,
                    zipped: this.fileInput.files[0].name.substring(this.fileInput.files[0].name.length - 3) === 'zip'
                }
            });
        }
    }

    cancelUpload = () => {
        this.selectedFile(null);
    }

    finishFileImport = () => {
        this.selectedFile(null);
    }

    render() {
        const {hasImport, isImporting, importStats} = this.props;

        const percent = importStats.stats ? Math.round((importStats.stats.written / importStats.stats.size) * 100) : 0;

        return (
            <div>
                { hasImport && (importStats.stats
                      ? <div className="mb-3">
                            { 'Importing ' + importStats.name }
                            <Progress color="info" value={ percent } className="my-2">
                                { percent }%
                            </Progress>
                            { !isImporting && <div className="d-flex flex-row justify-content-end my-1">
                                                  <Button size="sm"
                                                      color="info"
                                                      outline
                                                      onClick={ this.finishFileImport }>
                                                      Ok
                                                  </Button>
                                              </div> }
                        </div>
                      : <div className="mb-3">
                            <FormGroup color={ importStats.valid ? 'success' : 'danger' } className="m-0">
                                <FormFeedback className="mt-0 mb-1">
                                    { importStats.valid
                                      ? 'This name is not taken yet'
                                      : 'This name is already taken' }
                                </FormFeedback>
                                <Input type="text"
                                    name="newModel"
                                    value={ importStats.name }
                                    state={ importStats.valid ? 'success' : 'danger' }
                                    className="sidemenu-active"
                                    onChange={ this.changeName } />
                            </FormGroup>
                            <div className="d-flex flex-row justify-content-end my-1">
                                <Button size="sm"
                                    color="info"
                                    outline
                                    className="mr-1"
                                    disabled={ !importStats.valid }
                                    onClick={ this.uploadFile }>
                                    Import
                                </Button>
                                <Button size="sm"
                                    color="danger"
                                    outline
                                    onClick={ this.cancelUpload }>
                                    Cancel
                                </Button>
                            </div>
                        </div>) }
                <Form className="hidden-xl-down" getRef={ (form) => {
                                                              this.fileForm = form;
                                                          } }>
                    <Input type="file"
                        name="file"
                        accept="application/zip,text/xml"
                        onChange={ this.selectedFile }
                        getRef={ (input) => {
                                     this.fileInput = input;
                                 } } />
                </Form>
            </div>
        );
    }
}
;


ModelFileImport.propTypes = {
};

ModelFileImport.defaultProps = {
};

export default ModelFileImport