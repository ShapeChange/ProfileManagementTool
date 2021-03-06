import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Button, Form, FormGroup, FormFeedback, Label, Input, Progress } from 'reactstrap';
import FontAwesome from 'react-fontawesome';


class ModelFileExport extends Component {

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

    finishFileExport = (e, url) => {
        const {clearFileExport} = this.props;
        setTimeout(function() {
            clearFileExport();
            window.URL.revokeObjectURL(url);
        }, 50)
    }

    render() {
        const {hasExport, isExporting, exportStats, t} = this.props;

        const percent = exportStats.stats && exportStats.stats.progress ? Math.min(isExporting ? 99 : 100, exportStats.stats.progress) : 0;

        var url = !isExporting && exportStats && exportStats.data ? window.URL.createObjectURL(new Blob(exportStats.data)) : null
        return (
            <div className="w-100">
                { hasExport && exportStats.stats
                  && <div className="mb-3">
                         { isExporting ? (t('exporting') + '... ') : t('exported') }
                         { isExporting
                           ? <FontAwesome name="spinner" pulse />
                           : <FontAwesome name="check" /> }
                         <Progress color="info" value={ percent } className="my-2">
                             { percent }%
                         </Progress>
                         { !isExporting && <div className="d-flex flex-row justify-content-end my-1">
                                               <Button tag="a"
                                                   href={ url }
                                                   download={ `${exportStats.name}.zip` }
                                                   type="application/zip"
                                                   size="sm"
                                                   color="info"
                                                   outline
                                                   onClick={ (e) => this.finishFileExport(e, url) }>
                                                   { t('download') }
                                               </Button>
                                           </div> }
                     </div> }
            </div>
        );
    }
}
;


ModelFileExport.propTypes = {
};

ModelFileExport.defaultProps = {
};

export default ModelFileExport